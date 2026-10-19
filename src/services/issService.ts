import { LocationData } from '../types';
import { fetchJsonWithTimeout } from '../utils/fetchWithTimeout';
import { offlineRepository } from '../repositories/offlineRepository';

export interface IssPosition {
  lat: number;
  lng: number;
  alt: number;
  vel: number;
  timestamp: number;
}

export interface IssPass {
  rise: { time: string };
  duration_sec: number;
  visible: boolean;
}

export const fetchIssPosition = async (signal?: AbortSignal): Promise<IssPosition> => {
  const response = await fetchJsonWithTimeout('https://api.wheretheiss.at/v1/satellites/25544', { signal }, 8_000);
  if (!response.ok) throw new Error(`ISS_POSITION_HTTP_${response.status}`);
  // §6 zod ilk-yükleme: şema modülü ilk ağ doğrulamasına kadar geciktirilir.
  const { issPositionSchema, parseContract } = await import('../schemas/apiSchemas');
  const data = parseContract('WhereTheISS', issPositionSchema, response.data);
  return { lat: data.latitude, lng: data.longitude, alt: data.altitude, vel: data.velocity, timestamp: Date.now() };
};

const requestPasses = async (location: LocationData, visibleOnly: boolean, days: number, signal?: AbortSignal): Promise<IssPass[]> => {
  const url = `https://iss-api.polluxlabs.io/iss-pass?lat=${location.latitude}&lon=${location.longitude}&n=5&visible_only=${visibleOnly}&days_ahead=${days}`;
  const response = await fetchJsonWithTimeout(url, { signal }, 12_000);
  if (!response.ok) throw new Error(`ISS_PASS_HTTP_${response.status}`);
  // §6 zod ilk-yükleme: şema modülü ilk ağ doğrulamasına kadar geciktirilir.
  const { issPassResponseSchema, parseContract } = await import('../schemas/apiSchemas');
  return parseContract('Pollux ISS Pass', issPassResponseSchema, response.data).passes;
};

export const fetchIssPasses = async (location: LocationData, signal?: AbortSignal): Promise<{ passes: IssPass[]; cached: boolean; fetchedAt: number }> => {
  const cacheKey = `iss:passes:${location.latitude.toFixed(3)}:${location.longitude.toFixed(3)}`;
  const persist = async (passes: IssPass[]): Promise<{ passes: IssPass[]; cached: boolean; fetchedAt: number }> => {
    const fetchedAt = Date.now();
    await offlineRepository.put(cacheKey, passes, { source: 'Pollux ISS Pass', ttlMs: 6 * 60 * 60_000, updatedAt: fetchedAt });
    return { passes, cached: false, fetchedAt };
  };
  try {
    const visibleOnly = await requestPasses(location, true, 7, signal);
    if (visibleOnly.length) return await persist(visibleOnly);
    try {
      // F4.4: an "all passes below horizon" answer is still fresh data. The
      // widening request may fail — that no longer discards the fresh result
      // in favour of a stale cache.
      return await persist(await requestPasses(location, false, 3, signal));
    } catch (secondaryError) {
      if (signal?.aborted) throw secondaryError;
      return await persist(visibleOnly);
    }
  } catch (error) {
    if (signal?.aborted) throw error;
    const cached = await offlineRepository.get<IssPass[]>(cacheKey, { allowStale: true });
    if (cached) {
      // F1.1: reuse a stale cache only while it still contains upcoming passes. A fully elapsed
      // list is reported as "nothing upcoming" instead of resurfacing old passes (loop trigger).
      const nowMs = Date.now();
      const upcoming = cached.value.filter(pass => {
        const riseMs = new Date(pass.rise.time).getTime();
        return Number.isFinite(riseMs) && riseMs > nowMs;
      });
      return { passes: upcoming, cached: true, fetchedAt: cached.updatedAt };
    }
    throw error;
  }
};
