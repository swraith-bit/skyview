import { fetchWithTimeout } from './fetchWithTimeout';

const FALLBACK_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export const resolveTimezoneForCoordinates = async (
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<string> => {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', 'temperature_2m');
  url.searchParams.set('timezone', 'auto');

  try {
    const response = await fetchWithTimeout(url, { signal }, 6_000);
    if (!response.ok) return FALLBACK_TIMEZONE;
    // §6 zod ilk-yükleme: şema modülü ilk ağ doğrulamasına kadar geciktirilir.
    const { timezoneResponseSchema } = await import('../schemas/apiSchemas');
    const parsed = timezoneResponseSchema.safeParse(await response.json());
    return parsed.success ? parsed.data.timezone : FALLBACK_TIMEZONE;
  } catch {
    return FALLBACK_TIMEZONE;
  }
};
