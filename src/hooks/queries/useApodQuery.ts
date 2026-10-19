import { useQuery } from '@tanstack/react-query';
import { fetchApod, APODData, APODFetchError } from '../../services/apodService';
import { LangCode } from '../../i18n';
import { readStorageJson, writeStorageJson } from '../../utils/featureStorage';
import { offlineRepository } from '../../repositories/offlineRepository';

const getLocalDayKey = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

export interface ApodQueryData extends APODData {
  fetchedAt: number;
  isOfflineCache: boolean;
  source: 'NASA APOD';
  /** Present when the shown data came from cache because the live fetch failed (F1.5). */
  fetchError?: { status?: number; kind: 'http' | 'network' };
}

interface ApodCacheEntry {
  data: APODData;
  fetchedAt: number;
}

const describeApodFetchError = (error: unknown): ApodQueryData['fetchError'] => {
  if (error instanceof APODFetchError && typeof error.status === 'number') {
    return { status: error.status, kind: 'http' };
  }
  return { kind: 'network' };
};

export const useApodQuery = (_lang: LangCode) => {
  void _lang;
  return useQuery<ApodQueryData, APODFetchError>({
    queryKey: ['apod', getLocalDayKey()],
    queryFn: async ({ signal }) => {
      const requestedDate = getLocalDayKey();
      const offlineKey = `apod:${requestedDate}`;
      const legacyKey = `apod_cache_${requestedDate}`;
      let cached = await offlineRepository.get<APODData>(offlineKey, { allowStale: true });
      if (!cached) {
        const legacy = readStorageJson<ApodCacheEntry | APODData | null>(legacyKey, null);
        if (legacy) {
          const entry = 'data' in legacy && typeof legacy.data === 'object'
            ? legacy as ApodCacheEntry
            : { data: legacy as APODData, fetchedAt: Date.now() };
          cached = await offlineRepository.put(offlineKey, entry.data, { source: 'NASA APOD', ttlMs: 7 * 24 * 60 * 60_000, updatedAt: entry.fetchedAt });
        }
      }
      try {
        if (!navigator.onLine) throw new Error('Offline');
        const data = await fetchApod(requestedDate, signal);
        const fetchedAt = Date.now();
        writeStorageJson<ApodCacheEntry>(legacyKey, { data, fetchedAt });
        // F1.5: keep the cache key aligned with the date NASA actually served, so a
        // boundary-day clamp never splits between cache key and displayed picture.
        const canonicalOfflineKey = `apod:${typeof data.date === 'string' && data.date !== requestedDate ? data.date : requestedDate}`;
        await offlineRepository.put(canonicalOfflineKey, data, { source: 'NASA APOD', ttlMs: 7 * 24 * 60 * 60_000, updatedAt: fetchedAt });
        return { ...data, fetchedAt, isOfflineCache: false, source: 'NASA APOD' };
      } catch (error) {
        if (cached) {
          // F1.5: surface WHY a cached entry is being shown instead of swallowing the error.
          return {
            ...cached.value,
            fetchedAt: cached.updatedAt,
            isOfflineCache: true,
            source: 'NASA APOD',
            fetchError: describeApodFetchError(error),
          };
        }
        throw error;
      }
    },
    // NASA APOD only updates once a day. Cache it heavily.
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    // F1.5: only 5xx / network / timeout failures are retried; 4xx (e.g. DEMO_KEY quota) is terminal.
    retry: (attempt, error) => {
      if (error instanceof APODFetchError && typeof error.status === 'number' && error.status < 500) return false;
      return attempt < 1;
    },
  });
};
