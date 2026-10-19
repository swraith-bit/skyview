import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentLocationFallbackName, resolveLocationName } from './locationName';

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

describe('resolveLocationName', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the city from reverse geocoding and caches it', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ address: { city: 'Muğla' } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(resolveLocationName(37.07, 27.25, 'tr')).resolves.toBe('Muğla');
    await expect(resolveLocationName(37.07, 27.25, 'tr')).resolves.toBe('Muğla');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('uses a localized fallback when reverse geocoding fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));

    await expect(resolveLocationName(0, 0, 'tr')).resolves.toBe(getCurrentLocationFallbackName('tr'));
  });
});
