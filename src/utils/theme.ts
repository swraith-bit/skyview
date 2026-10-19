/**
 * TUR 2 — Semantik tema motoru.
 *
 * Tek kaynak: `data-theme` özniteliği. Bileşenler ham renk sınıfı yerine
 * `--sv-*` / `--color-app-*` token'larını tüketir; tema değişimi ekran
 * yeniden yüklenmeden tüm yüzeylere akar.
 */
export type ThemeMode = 'deep-space' | 'oled' | 'scotopic' | 'daylight';

export const THEME_MODES: readonly ThemeMode[] = ['deep-space', 'oled', 'scotopic', 'daylight'];

export const DEFAULT_THEME: ThemeMode = 'deep-space';

export const isThemeMode = (value: unknown): value is ThemeMode =>
  typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value);

/**
 * Saha modu her zaman scotopic'e zorlar: karanlık adaptasyonu bir tercih değil,
 * saha güvenliği kuralıdır. Kullanıcının seçtiği tema sahada korunur, alan
 * kapanınca geri gelir.
 */
export const resolveTheme = (themeMode: ThemeMode, fieldMode: boolean): ThemeMode =>
  fieldMode ? 'scotopic' : themeMode;

export const isScotopic = (theme: ThemeMode): boolean => theme === 'scotopic';
