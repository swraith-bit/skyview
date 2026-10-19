import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchIssPasses, fetchIssPosition } from './issService';

const mocks = vi.hoisted(() => ({
  fetchWithTimeout: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
}));

vi.mock('../utils/fetchWithTimeout', () => ({
  fetchWithTimeout: mocks.fetchWithTimeout,
  // The service's JSON helper delegates to the same mocked transport; wrap the
  // Response it returns so { status, ok, data } shape expectations keep working.
  fetchJsonWithTimeout: async (...args: unknown[]) => {
    const response = await mocks.fetchWithTimeout(...(args as []));
    return { status: response.status, ok: response.ok, data: await response.json() };
  },
}));
vi.mock('../repositories/offlineRepository', () => ({
  offlineRepository: { get: mocks.get, put: mocks.put },
}));

const location = { name: 'Test', latitude: 41, longitude: 29, timezone: 'Europe/Istanbul' };

describe('ISS service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('validates and maps the live ISS position', async () => {
    mocks.fetchWithTimeout.mockResolvedValue(new Response(JSON.stringify({ latitude: 10, longitude: 20, altitude: 420, velocity: 27600 }), { status: 200 }));
    await expect(fetchIssPosition()).resolves.toMatchObject({ lat: 10, lng: 20, alt: 420, vel: 27600 });
  });

  it('falls back to cached passes when the provider is unavailable, but only for upcoming passes', async () => {
    mocks.fetchWithTimeout.mockRejectedValue(new Error('offline'));
    mocks.get.mockResolvedValue({ value: [{ rise: { time: new Date(Date.now() + 2 * 3_600_000).toISOString() }, duration_sec: 300, visible: true }], updatedAt: 123 });
    await expect(fetchIssPasses(location)).resolves.toMatchObject({ cached: true, fetchedAt: 123, passes: [{ visible: true }] });
  });

  it('returns an empty list instead of resurfacing a stale cache whose passes are all in the past', async () => {
    mocks.fetchWithTimeout.mockRejectedValue(new Error('offline'));
    mocks.get.mockResolvedValue({ value: [{ rise: { time: '2026-07-14T20:00:00Z' }, duration_sec: 300, visible: true }], updatedAt: 123 });
    await expect(fetchIssPasses(location)).resolves.toMatchObject({ cached: true, fetchedAt: 123, passes: [] });
  });

  it('keeps only upcoming passes from a mixed stale cache', async () => {
    mocks.fetchWithTimeout.mockRejectedValue(new Error('offline'));
    const future = new Date(Date.now() + 3 * 3_600_000).toISOString();
    mocks.get.mockResolvedValue({
      value: [
        { rise: { time: '2026-07-14T20:00:00Z' }, duration_sec: 300, visible: true },
        { rise: { time: future }, duration_sec: 640, visible: false },
      ],
      updatedAt: 55,
    });
    await expect(fetchIssPasses(location)).resolves.toMatchObject({ cached: true, passes: [{ duration_sec: 640 }] });
  });

  it('keeps the fresh (empty) primary result instead of stale cache when the widening request fails', async () => {
    mocks.fetchWithTimeout
      .mockResolvedValueOnce(new Response(JSON.stringify({ passes: [] }), { status: 200 }))
      .mockRejectedValueOnce(new Error('ISS_PASS_HTTP_503'));
    mocks.get.mockResolvedValue({
      value: [{ rise: { time: new Date(Date.now() + 3_600_000).toISOString() }, duration_sec: 300, visible: false }],
      updatedAt: 1,
    });

    const result = await fetchIssPasses(location);

    // Fresh data beats a possibly outdated cache — an empty fresh list means
    // "nothing visible upcoming", not "use old data".
    expect(result.cached).toBe(false);
    expect(result.passes).toEqual([]);
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('still rejects when neither fresh data nor a stale cache exists', async () => {
    mocks.fetchWithTimeout.mockRejectedValue(new Error('offline'));
    mocks.get.mockResolvedValue(null);
    await expect(fetchIssPasses(location)).rejects.toThrow('offline');
  });

  it('rejects malformed provider data instead of passing it to the UI', async () => {
    mocks.fetchWithTimeout.mockResolvedValue(new Response(JSON.stringify({ latitude: 'bad' }), { status: 200 }));
    await expect(fetchIssPosition()).rejects.toThrow();
  });
});
