import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchSatelliteCatalog, getTleEpochMs, parseTleCatalog } from './satelliteService';

const mocks = vi.hoisted(() => ({
  fetchWithTimeout: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
}));

vi.mock('../utils/fetchWithTimeout', () => ({ fetchWithTimeout: mocks.fetchWithTimeout }));
vi.mock('../repositories/offlineRepository', () => ({ offlineRepository: { get: mocks.get, put: mocks.put } }));

const tle = `ISS (ZARYA)\n1 25544U 98067A   26195.00000000  .00000000  00000-0  00000-0 0  9999\n2 25544  51.6400 100.0000 0005000  20.0000 340.0000 15.50000000123456`;

describe('satellite catalog service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('parses named TLE records', () => {
    expect(parseTleCatalog(tle)[0]).toMatchObject({ OBJECT_NAME: 'ISS (ZARYA)', NORAD_CAT_ID: 25544 });
  });

  it('derives the TLE epoch (YYDDD.FFFFF → unix ms) for age badges (F4.4)', () => {
    // 2026-01-01 is the 194th day? No — day 195 → 26195 = July 14, 2026, 00:00 UTC.
    expect(getTleEpochMs('1 25544U 98067A   26195.00000000  .00000000  00000-0  00000-0 0  9999'))
      .toBe(Date.UTC(2026, 6, 14));
    expect(getTleEpochMs('1 99999U 24001A   25123.50000000  .00000000  00000-0  00000-0 0  9999'))
      .toBe(Date.UTC(2025, 4, 3, 12));
  });

  it('rejects malformed TLE epoch fields instead of showing a wrong age', () => {
    expect(getTleEpochMs('2 25544  51.6400 100.0000 0005000  20.0000 340.0000 15.5')).toBeNull();
    expect(getTleEpochMs('1 25544U 98067A   26999.00000000  .00000000  00000-0  00000-0 0  9999')).toBeNull();
    expect(getTleEpochMs('garbage')).toBeNull();
  });

  it('uses a structured offline catalog after a network failure', async () => {
    mocks.fetchWithTimeout.mockRejectedValue(new Error('offline'));
    const data = parseTleCatalog(tle);
    mocks.get.mockResolvedValue({ value: data, updatedAt: 456 });
    await expect(fetchSatelliteCatalog()).resolves.toMatchObject({ data, fetchedAt: 456, offline: true });
  });
});
