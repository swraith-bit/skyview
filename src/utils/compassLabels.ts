import type { LangCode } from '../i18n';
import { t } from '../i18n';
import { COMPASS_CODES, compassIndexForAzimuth } from './compass';

/**
 * Pusula kısaltmalarının ana-thread etiket katmanı (F5.6). Kısaltmalar
 * `i18nExtra.ts`'teki `compass.*` flat katmanında taranır; yardımcılar yalnızca
 * ana thread'de kullanılır (worker tarafı saf `utils/compass.ts`'i kullanır).
 */
export const localizeCompassCode = (code: string, lang: LangCode): string => {
  const normalized = code.trim().toLowerCase();
  const canonicalized = COMPASS_CODES as readonly string[];
  // Bilinmeyen kod (dışarıdan geçen 'SSE' gibi) hiçbir anahtara çevrilmeden öylece döner.
  if (!canonicalized.some(canonical => canonical.toLowerCase() === normalized)) return code;
  return t(`compass.${normalized}`, lang);
};

/** 45° dilimlerin yerelleştirilmiş kısa kod dizisi (indeks = azimuth / 45). */
export const getCompassLabels = (lang: LangCode): string[] => (
  COMPASS_CODES.map(code => localizeCompassCode(code, lang))
);

/** Azimuth → yerelleştirilmiş pusula kısaltması. */
export const getCompassDirection = (azimuth: number, lang: LangCode): string => (
  // compassIndexForAzimuth is always 0–7, so the fallback is unreachable.
  getCompassLabels(lang)[compassIndexForAzimuth(azimuth)] ?? ''
);
