import { useQuery } from '@tanstack/react-query';
import { fetchWeather } from '../../services/weatherService';
import { LocationData, ObservationData } from '../../types';
import { LangCode, getStatusText } from '../../i18n';
import { readStorageJson, writeStorageJson } from '../../utils/featureStorage';
import { offlineRepository } from '../../repositories/offlineRepository';

interface WeatherCacheEntry {
  data: ObservationData;
  timestamp: number;
}

export interface WeatherQueryData extends ObservationData {
  isOfflineCache: boolean;
  cachedAt?: number;
  fetchedAt: number;
  source: 'Open-Meteo';
}

export const useWeatherQuery = (location: LocationData, lang: LangCode) => {
  // F3.6: one rounded key for query/offline/storage caches — raw-coordinate
  // keys split the query cache on every GPS micro-fix while the offline layer
  // already used 4-decimal rounding.
  const latKey = location.latitude.toFixed(4);
  const lngKey = location.longitude.toFixed(4);
  return useQuery<WeatherQueryData, Error, WeatherQueryData>({
    queryKey: ['weather', latKey, lngKey],
    queryFn: async ({ signal }) => {
      const cacheKey = `weather_cache_${latKey}_${lngKey}`;
      const offlineKey = `weather:${latKey},${lngKey}`;
      let cached = await offlineRepository.get<ObservationData>(offlineKey, { allowStale: true });
      if (!cached) {
        const legacy = readStorageJson<WeatherCacheEntry | null>(cacheKey, null);
        if (legacy) cached = await offlineRepository.put(offlineKey, legacy.data, { source: 'Open-Meteo', ttlMs: 24 * 60 * 60_000, updatedAt: legacy.timestamp });
      }
      try {
        if (!navigator.onLine) throw new Error('Offline');
        const data = await fetchWeather(location, signal);
        const fetchedAt = Date.now();
        writeStorageJson<WeatherCacheEntry>(cacheKey, { data, timestamp: fetchedAt });
        await offlineRepository.put(offlineKey, data, { source: 'Open-Meteo', ttlMs: 24 * 60 * 60_000, updatedAt: fetchedAt });
        return { ...data, isOfflineCache: false, fetchedAt, source: 'Open-Meteo' };
      } catch (error) {
        if (cached) {
          const ageMs = Date.now() - cached.updatedAt;
          // Keep only sane, location-specific cache entries for offline use.
          if (ageMs >= 0 && ageMs < 24 * 60 * 60 * 1000) {
            return {
              ...cached.value,
              isOfflineCache: true,
              cachedAt: cached.updatedAt,
              fetchedAt: cached.updatedAt,
              source: 'Open-Meteo',
            };
          }
        }
        throw error;
      }
    },
    select: (data) => ({
      ...data,
      statusText: getStatusText(data.suitability, lang),
      isOfflineCache: data.isOfflineCache ?? false,
      fetchedAt: data.fetchedAt,
      source: data.source,
    }),
    // Keep cached data for 15 minutes before refetching
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000, // 24 hours garbage collection for offline support
  });
};
