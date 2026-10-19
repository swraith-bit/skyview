import { appStorage } from './storageRepository';

const DATABASE_NAME = 'skyview-offline';
const STORE_NAME = 'resources';
const DATABASE_VERSION = 1;
const FALLBACK_PREFIX = 'skyview_offline_';

export interface OfflineResource<T> {
  key: string;
  value: T;
  source: string;
  updatedAt: number;
  expiresAt: number;
  schemaVersion: number;
}

export interface OfflineReadOptions {
  allowStale?: boolean;
  schemaVersion?: number;
}

export interface OfflineWriteOptions {
  source: string;
  ttlMs: number;
  schemaVersion?: number;
  updatedAt?: number;
}

const isUsableResource = <T>(
  value: unknown,
  key: string,
  options: OfflineReadOptions,
): value is OfflineResource<T> => {
  if (!value || typeof value !== 'object') return false;
  const resource = value as Partial<OfflineResource<T>>;
  const schemaVersion = options.schemaVersion ?? 1;
  return resource.key === key
    && resource.schemaVersion === schemaVersion
    && typeof resource.updatedAt === 'number'
    && typeof resource.expiresAt === 'number'
    && typeof resource.source === 'string'
    && 'value' in resource
    && (options.allowStale === true || resource.expiresAt > Date.now());
};

const openDatabase = (): Promise<IDBDatabase | null> => {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise(resolve => {
    try {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

class IndexedDbOfflineRepository {
  private databasePromise = openDatabase();

  async get<T>(key: string, options: OfflineReadOptions = {}): Promise<OfflineResource<T> | null> {
    const database = await this.databasePromise;
    if (database) {
      const value = await new Promise<unknown>(resolve => {
        try {
          const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(null);
        } catch { resolve(null); }
      });
      if (isUsableResource<T>(value, key, options)) return value;
    }

    const fallback = appStorage.getJson<OfflineResource<T> | null>(`${FALLBACK_PREFIX}${key}`, null);
    return isUsableResource<T>(fallback, key, options) ? fallback : null;
  }

  async put<T>(key: string, value: T, options: OfflineWriteOptions): Promise<OfflineResource<T>> {
    const updatedAt = options.updatedAt ?? Date.now();
    const resource: OfflineResource<T> = {
      key,
      value,
      source: options.source,
      updatedAt,
      expiresAt: updatedAt + options.ttlMs,
      schemaVersion: options.schemaVersion ?? 1,
    };
    const database = await this.databasePromise;
    let stored = false;
    if (database) {
      stored = await new Promise<boolean>(resolve => {
        try {
          const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(resource);
          request.onsuccess = () => resolve(true);
          request.onerror = () => resolve(false);
        } catch { resolve(false); }
      });
    }
    if (!stored) appStorage.setJson(`${FALLBACK_PREFIX}${key}`, resource);
    return resource;
  }

  async remove(key: string): Promise<void> {
    appStorage.remove(`${FALLBACK_PREFIX}${key}`);
    const database = await this.databasePromise;
    if (!database) return;
    await new Promise<void>(resolve => {
      try {
        const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      } catch { resolve(); }
    });
  }
}

export const offlineRepository = new IndexedDbOfflineRepository();
