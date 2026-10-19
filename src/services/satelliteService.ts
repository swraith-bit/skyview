import { offlineRepository } from '../repositories/offlineRepository';
import { appStorage } from '../repositories/storageRepository';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

export interface CelesTrakObject {
  OBJECT_NAME: string;
  NORAD_CAT_ID: number;
  TLE_LINE1: string;
  TLE_LINE2: string;
}

const TRACKED_IDS = new Set([25544, 20580, 48274, 43013]);
const CACHE_KEY = 'skyview_satellite_tle_cache';
const OFFLINE_KEY = 'tle:stations';
export const SATELLITE_CACHE_TTL_MS = 24 * 60 * 60_000;

/**
 * F4.4: TLE epochunix from line-1 columns 19-32 (YYDDD.FFFFF). Older TLEs used
 * to draw unwaranteed positions silently; UI badges now derive from this.
 * Ported from satellite.js `satrec.jdsatepoch` semantics without pulling the
 * whole library into the cache layer.
 */
export const getTleEpochMs = (line1: string): number | null => {
  const rawYear = line1.slice(18, 20);
  const rawDay = line1.slice(20, 32);
  if (!/^\d{2}$/.test(rawYear) || !/^\d{1,3}\.\d+$/.test(rawDay.trim())) return null;
  const twoDigitYear = Number(rawYear);
  const epochYear = twoDigitYear < 57 ? 2000 + twoDigitYear : 1900 + twoDigitYear;
  const dayOfYear = Number(rawDay);
  if (!Number.isFinite(dayOfYear) || dayOfYear < 1 || dayOfYear > 367) return null;
  return Date.UTC(epochYear, 0, 1) + (dayOfYear - 1) * 86_400_000;
};

export const parseTleCatalog = (catalog: string): CelesTrakObject[] => {
  const lines = catalog.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const objects: CelesTrakObject[] = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    const line1 = lines[index];
    const line2 = lines[index + 1];
    if (!line1 || !line2 || !line1.startsWith('1 ') || !line2.startsWith('2 ')) continue; // noUncheckedIndexedAccess: bitişik satırlar her zaman mevcut
    const previous = lines[index - 1];
    const id = Number(line1.slice(2, 7));
    objects.push({ OBJECT_NAME: previous && !previous.startsWith('1 ') && !previous.startsWith('2 ') ? previous : `NORAD ${id}`, NORAD_CAT_ID: id, TLE_LINE1: line1, TLE_LINE2: line2 });
    index += 1;
  }
  return objects;
};

const readCache = async (): Promise<{ data: CelesTrakObject[]; fetchedAt: number; offline: boolean } | null> => {
  const structured = await offlineRepository.get<CelesTrakObject[]>(OFFLINE_KEY, { allowStale: true });
  const legacy = appStorage.getJson<{ fetchedAt?: number; data?: CelesTrakObject[] } | null>(CACHE_KEY, null);
  const cached = structured ? { fetchedAt: structured.updatedAt, data: structured.value } : legacy;
  if (!Array.isArray(cached?.data) || !cached.fetchedAt) return null;
  return { data: cached.data, fetchedAt: cached.fetchedAt, offline: true };
};

export const fetchSatelliteCatalog = async (signal?: AbortSignal): Promise<{ data: CelesTrakObject[]; fetchedAt: number; offline: boolean }> => {
  try {
    const response = await fetchWithTimeout('https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle', { signal }, 12_000);
    if (!response.ok) throw new Error(`CELESTRAK_HTTP_${response.status}`);
    const parsed = parseTleCatalog(await response.text());
    // §6 zod ilk-yükleme: şema modülü ilk ağ doğrulamasına kadar geciktirilir.
    // (import hatası da try-catch zincirine düşer → cache fallback semantiği korunur.)
    const { tleCatalogSchema } = await import('../schemas/apiSchemas');
    const data = tleCatalogSchema.parse(parsed);
    const preferred = data.filter(item => TRACKED_IDS.has(item.NORAD_CAT_ID));
    const additions = data.filter(item => !TRACKED_IDS.has(item.NORAD_CAT_ID));
    const selected = [...preferred, ...additions].slice(0, 6);
    const fetchedAt = Date.now();
    appStorage.setJson(CACHE_KEY, { fetchedAt, data: selected });
    await offlineRepository.put(OFFLINE_KEY, selected, { source: 'CelesTrak', ttlMs: SATELLITE_CACHE_TTL_MS, updatedAt: fetchedAt });
    return { data: selected, fetchedAt, offline: false };
  } catch (error) {
    if (signal?.aborted) throw error;
    const cached = await readCache();
    if (cached) return cached;
    throw error;
  }
};
