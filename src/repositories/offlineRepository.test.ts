import { beforeEach, describe, expect, it, vi } from 'vitest';
import { offlineRepository } from './offlineRepository';

class MemoryStorage {
  values = new Map<string, string>();
  get length() { return this.values.size; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
}

describe('offline repository fallback', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage());
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
  });

  it('stores source, expiry and schema metadata', async () => {
    await offlineRepository.put('weather:test', { cloud: 12 }, { source: 'Open-Meteo', ttlMs: 60_000, schemaVersion: 2 });
    const value = await offlineRepository.get<{ cloud: number }>('weather:test', { schemaVersion: 2 });
    expect(value).toMatchObject({ value: { cloud: 12 }, source: 'Open-Meteo', schemaVersion: 2 });
  });

  it('rejects expired or incompatible resources unless stale data is explicitly allowed', async () => {
    await offlineRepository.put('apod:test', { title: 'Space' }, { source: 'NASA APOD', ttlMs: 100, schemaVersion: 1 });
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_001_000);
    await expect(offlineRepository.get('apod:test')).resolves.toBeNull();
    await expect(offlineRepository.get('apod:test', { allowStale: true, schemaVersion: 2 })).resolves.toBeNull();
    await expect(offlineRepository.get('apod:test', { allowStale: true, schemaVersion: 1 })).resolves.not.toBeNull();
  });
});
