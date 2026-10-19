/**
 * F6.7 — Count-up çekirdeği (saf; rAF/React'e dokunmaz, node-test edilebilir).
 *
 *  - `prefersReducedMotion` Modal.tsx ile aynı matchMedia sözleşmesini izler:
 *    reduce'da animasyon hiç kurulmaz (kanca anında hedefe yapışır).
 *  - `createTween` yalnızca "geçen ms → değer" hesaplar; rAF ve state React
 *    tarafında kalır (`hooks/useCountUp.ts`). Böylece animasyon matematiği
 *    node ortamında, çizim kurallarından ayrı test edilir.
 *  - Süre ≤ 0 veya sonlu olmayan hedef: anında hedefe yapış (snap) — bu
 *    girişlerde animasyonsuz davranış tek doğrudur.
 */

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface Tween {
  /** Baştan `elapsedMs` sonra gösterilecek değer. */
  at(elapsedMs: number): number;
  /** `elapsedMs`'te hedefe ulaşıldı mı (kanca bu noktada rAF döngüsünü keser). */
  reached(elapsedMs: number): boolean;
}

export const createTween = (from: number, to: number, durationMs: number): Tween => {
  // Sonlu olmayan girişler (NaN/Infinity) veya sıfır/negatif süre: snap.
  if (!Number.isFinite(from) || !Number.isFinite(to) || !Number.isFinite(durationMs) || durationMs <= 0 || from === to) {
    const snapped = Number.isFinite(to) ? to : from;
    return { at: () => snapped, reached: () => true };
  }
  const delta = to - from;
  return {
    at: (elapsedMs) => from + delta * easeOutCubic(Math.min(1, Math.max(0, elapsedMs / durationMs))),
    reached: (elapsedMs) => elapsedMs >= durationMs,
  };
};
