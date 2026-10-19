import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { extractLatestKp, fetchLatestKp, readCachedKp } from './kpService';

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const KP_CACHE_KEY = 'skyview_noaa_kp_last';

describe('Kp service', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('extracts the latest finite Kp value from NOAA rows', () => {
    expect(extractLatestKp([
      ['time_tag', 'Kp'],
      ['2026-06-15 00:00', '2.33'],
      ['2026-06-15 03:00', 'bad'],
      ['2026-06-15 06:00', '4.67'],
    ])).toBe(4.67);

    expect(extractLatestKp([{ Kp: '1.3' }, { Kp: 5 }])).toBe(5);
  });

  it('removes corrupt cached Kp values and returns null', () => {
    storage.setItem(KP_CACHE_KEY, '{broken');

    expect(readCachedKp(true)).toBeNull();
    expect(storage.getItem(KP_CACHE_KEY)).toBeNull();
  });

  it('falls back to stale cached Kp when the network fails', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    storage.setItem(KP_CACHE_KEY, JSON.stringify({
      value: 3.7,
      fetchedAt: Date.now() - 48 * 60 * 60 * 1000,
    }));
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('offline');
    }));

    await expect(fetchLatestKp()).resolves.toBe(3.7);
  });
});
