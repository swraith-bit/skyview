import { LangCode } from '../i18n';
import { LocationData } from '../types';
import { fetchJsonWithTimeout } from '../utils/fetchWithTimeout';

export const searchLocations = async (
  query: string,
  lang: LangCode,
  signal?: AbortSignal,
  count = 6,
): Promise<LocationData[]> => {
  const value = query.trim();
  if (!value) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value)}&count=${count}&language=${lang}&format=json`;
  const response = await fetchJsonWithTimeout(url, { signal }, 8_000);
  if (!response.ok) throw new Error(`GEOCODING_HTTP_${response.status}`);
  // §6 zod ilk-yükleme: şema modülü ilk ağ doğrulamasına kadar geciktirilir.
  const { geocodingResponseSchema, parseContract } = await import('../schemas/apiSchemas');
  const payload = parseContract('Open-Meteo Geocoding', geocodingResponseSchema, response.data);
  return (payload.results ?? []).map(item => ({
    name: `${item.name}${item.country ? ` (${item.country})` : ''}`,
    latitude: item.latitude,
    longitude: item.longitude,
    country: item.country,
    timezone: item.timezone,
  }));
};
