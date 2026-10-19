/**
 * Pusula köşesi matematiği (F5.6). Worker-safe: yalnızca kanonik kodlar ve
 * saf indeks hesabı; i18n runtime'ı buraya gelmez. Gökyüzü verileri N…NW
 * kanonik kodlarını taşır; etiketler ana thread'de `compassLabels.ts`
 * üzerinden çözülür.
 */
export const COMPASS_CODES = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export type CompassCode = (typeof COMPASS_CODES)[number];

/** Azimuth (−∞, +∞) → 0…7 kanonik dilim indeksi (N'den saat yönünde, 45° dilimler). */
export const compassIndexForAzimuth = (azimuth: number): number => {
  const normalized = ((azimuth % 360) + 360) % 360;
  return Math.round(normalized / 45) % 8;
};

export const canonicalCompassCode = (azimuth: number): CompassCode => (
  // compassIndexForAzimuth is always 0–7, so the fallback is unreachable.
  COMPASS_CODES[compassIndexForAzimuth(azimuth)] ?? 'N'
);
