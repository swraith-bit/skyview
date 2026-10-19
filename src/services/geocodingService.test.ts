import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchLocations } from './geocodingService';

describe('searchLocations', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('validates and maps geocoding results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [{ name: 'Bodrum', latitude: 37.03, longitude: 27.43, country: 'Türkiye', timezone: 'Europe/Istanbul' }] }), { status: 200 })));
    await expect(searchLocations('Bodrum', 'tr')).resolves.toEqual([expect.objectContaining({ name: 'Bodrum (Türkiye)', latitude: 37.03 })]);
  });
  it('rejects malformed coordinates', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [{ name: 'Bad', latitude: 'x', longitude: 1 }] }), { status: 200 })));
    await expect(searchLocations('Bad', 'en')).rejects.toThrow('INVALID_API_RESPONSE');
  });
});
