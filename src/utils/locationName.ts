import { LangCode } from '../i18n';
import { readStorageJson, writeStorageJson } from './featureStorage';
import { fetchWithTimeout } from './fetchWithTimeout';

const CACHE_TTL_MS = 30 * 24 * 60 * 60_000;

interface LocationNameCacheEntry {
  name: string;
  savedAt: number;
}

export const getCurrentLocationFallbackName = (lang: LangCode): string => {
  if (lang === 'tr') return 'Mevcut Konumum';
  if (lang === 'de') return 'Mein Standort';
  if (lang === 'fr') return 'Ma position';
  if (lang === 'es') return 'Mi ubicacion';
  if (lang === 'it') return 'La mia posizione';
  if (lang === 'pt') return 'Minha localizacao';
  if (lang === 'ar') return 'موقعي الحالي';
  return 'My Location';
};

const getCacheKey = (latitude: number, longitude: number, lang: LangCode): string => (
  `skyview_location_name_${latitude.toFixed(3)}_${longitude.toFixed(3)}_${lang}`
);

export const resolveLocationName = async (
  latitude: number,
  longitude: number,
  lang: LangCode,
  signal?: AbortSignal,
): Promise<string> => {
  const fallback = getCurrentLocationFallbackName(lang);
  const cacheKey = getCacheKey(latitude, longitude, lang);
  const cached = readStorageJson<LocationNameCacheEntry | null>(cacheKey, null);
  if (cached && Date.now() - cached.savedAt >= 0 && Date.now() - cached.savedAt < CACHE_TTL_MS) {
    return cached.name;
  }

  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(latitude));
  url.searchParams.set('lon', String(longitude));
  url.searchParams.set('zoom', '10');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', lang);

  try {
    const response = await fetchWithTimeout(url, { signal, headers: { Accept: 'application/json' } }, 6_000);
    if (!response.ok) return fallback;
    // §6 zod ilk-yükleme: şema modülü ilk ağ doğrulamasına kadar geciktirilir.
    const { reverseGeocodeSchema } = await import('../schemas/apiSchemas');
    const parsed = reverseGeocodeSchema.safeParse(await response.json());
    if (!parsed.success) return fallback;
    const data = parsed.data;
    const address = data.address;
    const name = address?.city || address?.town || address?.village || address?.municipality || address?.county || address?.state || address?.country;
    if (!name) return fallback;
    writeStorageJson<LocationNameCacheEntry>(cacheKey, { name, savedAt: Date.now() });
    return name;
  } catch {
    return fallback;
  }
};
