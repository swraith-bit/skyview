import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  appStorage,
  HybridStorageRepository,
  setStorageDiagnosticsListener,
  type StorageDiagnosticEvent,
} from './storageRepository';

const { nativeFlag, preferencesMock } = vi.hoisted(() => ({
  nativeFlag: { value: false },
  preferencesMock: {
    keys: vi.fn<() => Promise<{ keys: string[] }>>(),
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => nativeFlag.value },
}));

vi.mock('@capacitor/preferences', () => ({
  Preferences: preferencesMock,
}));

class MemoryStorage {
  values = new Map<string, string>();
  get length() { return this.values.size; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
}

describe('storageRepository diagnostics (F5.2)', () => {
  let events: StorageDiagnosticEvent[];

  beforeEach(() => {
    preferencesMock.keys.mockReset();
    preferencesMock.get.mockReset();
    preferencesMock.set.mockReset();
    preferencesMock.remove.mockReset();
    vi.stubGlobal('localStorage', new MemoryStorage());
    events = [];
    setStorageDiagnosticsListener(event => { events.push(event); });
    nativeFlag.value = false;
  });

  afterEach(() => {
    setStorageDiagnosticsListener(null);
    vi.unstubAllGlobals();
    nativeFlag.value = false;
  });

  it('bozuk JSON düşüşünü json-parse-failed olarak kaydeder ve kendini onarır', () => {
    appStorage.setString('broken-entry', '{oops');
    const healed = appStorage.getJson('broken-entry', { ok: true });

    expect(healed).toEqual({ ok: true });
    expect(appStorage.getString('broken-entry')).toBeNull();
    expect(events).toEqual([{
      severity: 'warning',
      name: 'json-parse-failed',
      key: 'broken-entry',
    }]);
  });

  it('başarılı okumada etkinlik üretmez', () => {
    appStorage.setJson('good-entry', { ok: true });
    expect(appStorage.getJson('good-entry', { ok: false })).toEqual({ ok: true });
    expect(events).toEqual([]);
  });

  it('native init düşüşünde native-init-failed kaydeder ve browser storage ile çalışmayı sürdürür', async () => {
    nativeFlag.value = true;
    preferencesMock.keys.mockRejectedValue(new Error('native init boom'));

    const repo = new HybridStorageRepository();
    await repo.initialize();

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      severity: 'warning',
      name: 'native-init-failed',
      detail: 'native init boom',
    });

    repo.setString('fallback-key', 'fallback-value');
    expect(repo.getString('fallback-key')).toBe('fallback-value');
    nativeFlag.value = false;
  });

  it('native yazma bitiminde native-write-failed kaydeder ve cache rollback uygular', async () => {
    nativeFlag.value = true;
    preferencesMock.keys.mockResolvedValue({ keys: ['staged-key'] });
    preferencesMock.get.mockResolvedValue({ value: 'previous-value' });

    const repo = new HybridStorageRepository();
    await repo.initialize();

    preferencesMock.set.mockRejectedValue(new Error('native write boom'));
    const outcome = await repo.setStringAsync('staged-key', 'new-value');

    expect(outcome).toBe(false);
    expect(events).toEqual([{
      severity: 'error',
      name: 'native-write-failed',
      key: 'staged-key',
      detail: 'native write boom',
    }]);
    expect(repo.getString('staged-key')).toBe('previous-value');
    nativeFlag.value = false;
  });

  it('localStorage yazması düşerse write-failed kaydeder ve false döner', () => {
    const store = new MemoryStorage();
    vi.stubGlobal('localStorage', store);
    vi.spyOn(store, 'setItem').mockImplementation(key => {
      if (key === 'doomed-key') throw new Error('quota exceeded');
    });

    const outcome = appStorage.setString('doomed-key', 'value');

    expect(outcome).toBe(false);
    expect(events).toEqual([{
      severity: 'error',
      name: 'write-failed',
      key: 'doomed-key',
      detail: 'quota exceeded',
    }]);
  });
});

describe('storageRepository yaşam döngüsü (yazma kuyruğu / göç / keys)', () => {
  beforeEach(() => {
    preferencesMock.keys.mockReset();
    preferencesMock.get.mockReset();
    preferencesMock.set.mockReset();
    preferencesMock.remove.mockReset();
    vi.stubGlobal('localStorage', new MemoryStorage());
    nativeFlag.value = false;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    nativeFlag.value = false;
  });

  it('legacy localStorage girişlerini native tarafa göç eder ve yerelden siler', async () => {
    nativeFlag.value = true;
    preferencesMock.keys.mockResolvedValue({ keys: ['skyview_native_key'] });
    preferencesMock.get.mockImplementation(async ({ key }) => ({
      value: key === 'skyview_native_key' ? 'native-value' : null,
    }));
    const store = new MemoryStorage();
    store.setItem('skyview_legacy_key', 'legacy-value');
    vi.stubGlobal('localStorage', store);

    const repo = new HybridStorageRepository();
    await repo.initialize();

    expect(preferencesMock.set).toHaveBeenCalledWith({ key: 'skyview_legacy_key', value: 'legacy-value' });
    expect(repo.getString('skyview_legacy_key')).toBe('legacy-value');
    expect(repo.getString('skyview_native_key')).toBe('native-value');
  });

  it('yazma kuyruğu sıralıdır — bir native yazma bitmeden diğeri başlamaz', async () => {
    nativeFlag.value = true;
    preferencesMock.keys.mockResolvedValue({ keys: [] });

    const repo = new HybridStorageRepository();
    await repo.initialize();

    const events: string[] = [];
    preferencesMock.set.mockImplementation(async ({ key }) => {
      events.push(`begin:${key}`);
      await new Promise(resolve => setTimeout(resolve, key === 'a' ? 40 : 5));
      events.push(`end:${key}`);
      return undefined;
    });

    const outcomes = await Promise.all([
      repo.setStringAsync('a', '1'),
      repo.setStringAsync('b', '2'),
      repo.setStringAsync('c', '3'),
    ]);

    expect(outcomes).toEqual([true, true, true]);
    expect(events.indexOf('begin:b')).toBeGreaterThan(events.indexOf('end:a'));
    expect(events.indexOf('begin:c')).toBeGreaterThan(events.indexOf('end:b'));
  });

  it('flush() kuyruğun tamamen tahliyesine kadar çözülmez', async () => {
    nativeFlag.value = true;
    preferencesMock.keys.mockResolvedValue({ keys: [] });

    const repo = new HybridStorageRepository();
    await repo.initialize();

    let settled = false;
    preferencesMock.set.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 25));
      settled = true;
      return undefined;
    });

    const writePromise = repo.setStringAsync('a', '1');
    const flushPromise = repo.flush();

    await writePromise;
    expect(settled).toBe(true);
    await flushPromise;
    expect(settled).toBe(true);
  });

  it('keys() ön-eke göre bulur; native yolu cache, web yolu storage tarar', () => {
    const repo = new HybridStorageRepository();
    repo.setString('skyview_targets_v1', 'a');
    repo.setString('skyview_weather_v1', 'b');
    repo.setString('unrelated_v1', 'c');

    expect(repo.keys('skyview_')).toEqual([
      'skyview_targets_v1',
      'skyview_weather_v1',
    ]);
    expect(repo.keys().length).toBe(3);
  });
});
