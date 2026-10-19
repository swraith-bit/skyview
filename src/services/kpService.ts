import { appStorage } from '../repositories/storageRepository';
import { fetchJsonWithTimeout } from '../utils/fetchWithTimeout';
import { offlineRepository } from '../repositories/offlineRepository';

const KP_CACHE_KEY = 'skyview_noaa_kp_last';
const CACHE_TTL_MS = 6 * 60 * 60_000;

export interface KpReading {
  value: number;
  fetchedAt: number;
  isOfflineCache: boolean;
  source: 'NOAA SWPC';
}

const readCachedKpReading = (allowStale = false): KpReading | null => {
  const cached = appStorage.getJson<{ value?: number; fetchedAt?: number } | null>(KP_CACHE_KEY, null);
  if (
    typeof cached?.value === 'number'
    && Number.isFinite(cached.value)
    && typeof cached.fetchedAt === 'number'
    && (allowStale || Date.now() - cached.fetchedAt < CACHE_TTL_MS)
  ) {
    return { value: cached.value, fetchedAt: cached.fetchedAt, isOfflineCache: true, source: 'NOAA SWPC' };
  }
  return null;
};

export const readCachedKp = (allowStale = false): number | null => {
  return readCachedKpReading(allowStale)?.value ?? null;
};

export const extractLatestKp = (data: unknown): number | null => {
  if (!Array.isArray(data)) return null;
  for (let index = data.length - 1; index >= 0; index -= 1) {
    const row = data[index];
    const value = Array.isArray(row)
      ? Number(row[1])
      : Number((row as { Kp?: number | string } | null)?.Kp);
    if (Number.isFinite(value)) return value;
  }
  return null;
};

export const fetchLatestKpReading = async (
  signal?: AbortSignal,
): Promise<KpReading | null> => {
  const structured = await offlineRepository.get<number>('kp:latest');
  if (structured && Number.isFinite(structured.value)) {
    return { value: structured.value, fetchedAt: structured.updatedAt, isOfflineCache: true, source: 'NOAA SWPC' };
  }
  const cached = readCachedKpReading(false);
  if (cached !== null) return cached;

  try {
    const response = await fetchJsonWithTimeout(
      'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
      { signal },
      10_000,
    );
    if (!response.ok) return readCachedKpReading(true);
    const payload = response.data;
    if (!(await import('../schemas/apiSchemas')).kpResponseSchema.safeParse(payload).success) return readCachedKpReading(true);
    const kp = extractLatestKp(payload);
    if (kp === null) return readCachedKpReading(true);
    const fetchedAt = Date.now();
    appStorage.setJson(KP_CACHE_KEY, { value: kp, fetchedAt });
    await offlineRepository.put('kp:latest', kp, { source: 'NOAA SWPC', ttlMs: CACHE_TTL_MS, updatedAt: fetchedAt });
    return { value: kp, fetchedAt, isOfflineCache: false, source: 'NOAA SWPC' };
  } catch {
    return readCachedKpReading(true);
  }
};

export const fetchLatestKp = async (signal?: AbortSignal): Promise<number | null> => (
  (await fetchLatestKpReading(signal))?.value ?? null
);
