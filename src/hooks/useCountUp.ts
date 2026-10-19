import { useEffect, useRef, useState } from 'react';
import { createTween, prefersReducedMotion } from '../utils/countUp';

/**
 * F6.7 — Count-up kancası (animasyonlu sayı değeri):
 *
 *  - Değer değiştiğinde önceki ekranda görünen değerden hedefe `easeOutCubic`
 *    ile kayar; her karede `setDisplay` çağırır, hedefe ulaştığında döngüyü
 *    keser. İlk mount'ta animasyon yok (görünen değer zaten hedefe eşit) —
 *    büyük istatistik değeri aynasız ilk değerini gösterir.
 *  - `prefers-reduced-motion: reduce` veya rAF yokluğu (test/node ortamı):
 *    hedefe anında yapışır — animasyon bir süsleme katmanıdır; bilgiyi
 *    geciktirmemelidir.
 *  - Hedef değişimi effect'te tek tween başlatır; unmount veya tween sırasında
 *    gelen yeni hedef önceki döngüyü iptal eder (rAF yarışı olmaz).
 *  - Rakam genişliği: tabular-nums `body` çapında F6.3 ile sabit, animasyon
 *    sırasında genişlik oynaması olmaz.
 */
export const useCountUp = (target: number, durationMs = 600): number => {
  const [display, setDisplay] = useState(() => (Number.isFinite(target) ? target : 0));
  const displayRef = useRef(display);

  useEffect(() => {
    if (displayRef.current === target) return;
    if (!Number.isFinite(target)) return; // bozuk/eksik hedef: görüntüyü koru
    const snap = () => {
      displayRef.current = target;
      setDisplay(target);
    };
    if (prefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
      snap();
      return;
    }
    const tween = createTween(displayRef.current, target, durationMs);
    const start = performance.now();
    let raf = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const elapsed = performance.now() - start;
      const value = tween.at(elapsed);
      displayRef.current = value;
      setDisplay(value);
      if (!tween.reached(elapsed)) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [target, durationMs]);

  return display;
};
