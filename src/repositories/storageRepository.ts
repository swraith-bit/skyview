import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export interface StorageRepository {
  initialize(): Promise<void>;
  getString(key: string): string | null;
  setString(key: string, value: string): boolean;
  setStringAsync(key: string, value: string): Promise<boolean>;
  getJson<T>(key: string, fallback: T): T;
  setJson<T>(key: string, value: T): boolean;
  setJsonAsync<T>(key: string, value: T): Promise<boolean>;
  remove(key: string): boolean;
  removeAsync(key: string): Promise<boolean>;
  flush(): Promise<void>;
  keys(prefix?: string): string[];
}

const browserKeys = (): string[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    return Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key): key is string => Boolean(key));
  } catch {
    return [];
  }
};

const delay = (ms: number): Promise<void> => new Promise(resolve => {
  setTimeout(resolve, ms);
});

/**
 * Storage seviyesinde kayıt gerekçesi. Kilometre taşı: storageRepository, diagnostics
 * modülünü doğrudan import etmemeli (dairesel bağımlılık — diagnostics, kalıcılık
 * için appStorage'ı kullanıyor). Gözlemlenebilirlik katmanı bu kanca üzerinden bağlanır.
 */
export type StorageDiagnosticEvent = {
  severity: 'warning' | 'error';
  name: 'json-parse-failed' | 'native-init-failed' | 'write-failed' | 'native-write-failed';
  key?: string;
  detail?: string;
};

let storageDiagnosticListener: ((event: StorageDiagnosticEvent) => void) | null = null;

export const setStorageDiagnosticsListener = (
  listener: ((event: StorageDiagnosticEvent) => void) | null,
): void => {
  storageDiagnosticListener = listener;
};

const recordStorageDiagnostic = (event: StorageDiagnosticEvent): void => {
  try {
    storageDiagnosticListener?.(event);
  } catch {
    /* teşhis geri beslemesi asla storage davranışını bozmaz */
  }
};

export class HybridStorageRepository implements StorageRepository {
  private cache = new Map<string, string>();
  private native = false;
  private initialization: Promise<void> | null = null;
  private writeQueue: Promise<void> = Promise.resolve();
  private readonly maxRetries = 3;

  initialize(): Promise<void> {
    if (this.initialization) return this.initialization;
    this.initialization = this.initializeStorage();
    return this.initialization;
  }

  private async initializeStorage(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const { keys } = await Preferences.keys();
      const storedEntries = await Promise.all(keys.map(async key => {
        const { value } = await Preferences.get({ key });
        return [key, value] as const;
      }));
      storedEntries.forEach(([key, value]) => {
        if (value !== null) this.cache.set(key, value);
      });

      const legacyEntries = browserKeys().map(key => [key, localStorage.getItem(key)] as const)
        .filter((entry): entry is readonly [string, string] => entry[1] !== null);
      const migrated: string[] = [];
      for (const [key, value] of legacyEntries) {
        if (!this.cache.has(key)) {
          await Preferences.set({ key, value });
          this.cache.set(key, value);
        }
        migrated.push(key);
      }

      migrated.forEach(key => {
        try { localStorage.removeItem(key); } catch { /* migration already succeeded */ }
      });
      this.native = true;
    } catch (error) {
      this.cache.clear();
      this.native = false;
      console.warn('Native preferences initialization failed; browser storage will be used.', error);
      recordStorageDiagnostic({
        severity: 'warning',
        name: 'native-init-failed',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  getString(key: string): string | null {
    if (this.native) return this.cache.get(key) ?? null;
    if (typeof localStorage === 'undefined') return null;
    try { return localStorage.getItem(key); } catch { return null; }
  }

  setString(key: string, value: string): boolean {
    if (this.native) {
      const hadPrevious = this.cache.has(key);
      const previousValue = this.cache.get(key);
      this.cache.set(key, value);
      void this.enqueueWriteWithRetry(
        () => Preferences.set({ key, value }),
        () => {
          if (this.cache.get(key) === value) {
            if (hadPrevious && previousValue !== undefined) {
              this.cache.set(key, previousValue);
            } else {
              this.cache.delete(key);
            }
          }
        },
        key,
      );
      return true;
    }
    if (typeof localStorage === 'undefined') return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Storage write failed for ${key}`, error);
      recordStorageDiagnostic({
        severity: 'error',
        name: 'write-failed',
        key,
        detail: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async setStringAsync(key: string, value: string): Promise<boolean> {
    if (!this.native) return this.setString(key, value);
    const hadPrevious = this.cache.has(key);
    const previousValue = this.cache.get(key);
    this.cache.set(key, value);
    return this.enqueueWriteWithRetry(
      () => Preferences.set({ key, value }),
      () => {
        if (this.cache.get(key) === value) {
          if (hadPrevious && previousValue !== undefined) {
            this.cache.set(key, previousValue);
          } else {
            this.cache.delete(key);
          }
        }
      },
      key,
    );
  }

  getJson<T>(key: string, fallback: T): T {
    const value = this.getString(key);
    if (!value) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      this.remove(key);
      recordStorageDiagnostic({
        severity: 'warning',
        name: 'json-parse-failed',
        key,
      });
      return fallback;
    }
  }

  setJson<T>(key: string, value: T): boolean {
    try { return this.setString(key, JSON.stringify(value)); } catch { return false; }
  }

  async setJsonAsync<T>(key: string, value: T): Promise<boolean> {
    try { return await this.setStringAsync(key, JSON.stringify(value)); } catch { return false; }
  }

  remove(key: string): boolean {
    if (this.native) {
      const hadPrevious = this.cache.has(key);
      const previousValue = this.cache.get(key);
      this.cache.delete(key);
      void this.enqueueWriteWithRetry(
        () => Preferences.remove({ key }),
        () => {
          if (!this.cache.has(key) && hadPrevious && previousValue !== undefined) {
            this.cache.set(key, previousValue);
          }
        },
        key,
      );
      return true;
    }
    if (typeof localStorage === 'undefined') return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  async removeAsync(key: string): Promise<boolean> {
    if (!this.native) return this.remove(key);
    const hadPrevious = this.cache.has(key);
    const previousValue = this.cache.get(key);
    this.cache.delete(key);
    return this.enqueueWriteWithRetry(
      () => Preferences.remove({ key }),
      () => {
        if (!this.cache.has(key) && hadPrevious && previousValue !== undefined) {
          this.cache.set(key, previousValue);
        }
      },
      key,
    );
  }

  flush(): Promise<void> {
    return this.writeQueue;
  }

  keys(prefix = ''): string[] {
    if (this.native) return [...this.cache.keys()].filter(key => key.startsWith(prefix));
    return browserKeys().filter(key => key.startsWith(prefix));
  }

  private enqueueWriteWithRetry(
    operation: () => Promise<void>,
    rollback: () => void,
    key: string,
  ): Promise<boolean> {
    const task = this.writeQueue.then(async () => {
      let attempts = 0;
      while (attempts < this.maxRetries) {
        try {
          await operation();
          return true;
        } catch (error) {
          attempts += 1;
          if (attempts >= this.maxRetries) {
            rollback();
            console.error(`Native preferences write failed after ${this.maxRetries} retries for ${key}.`, error);
            recordStorageDiagnostic({
              severity: 'error',
              name: 'native-write-failed',
              key,
              detail: error instanceof Error ? error.message : String(error),
            });
            return false;
          }
          await delay(50 * attempts);
        }
      }
      return false;
    });
    this.writeQueue = task.then(() => undefined, () => undefined);
    return task;
  }
}

export const appStorage: StorageRepository = new HybridStorageRepository();
