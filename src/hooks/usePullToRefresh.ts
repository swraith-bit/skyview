import React from 'react';
import { selectionHaptic } from '../utils/haptics';

export interface PullToRefreshState {
  /** Anlık çekim mesafesi (px; 0 = hareketsiz — indikatör gösterimi için). */
  pullDistance: number;
  /** Yenileme isteği çalışıyor (indikatör + touchmove kilidi için). */
  isRefreshing: boolean;
}

interface PullToRefreshOptions {
  /** Bu mesafeden fazla çekimde yenileme tetiklenir. */
  threshold?: number;
  /** Damping üst sınırı (native PTR hissi: 1:1 yerine yumuşak doygunluk). */
  maxPull?: number;
}

/**
 * F6.9 — pull-to-refresh (yalnızca dikey dokunma):
 *
 *  - Yalnızca dokunma jestleri katılır (masaüstü fare sürüklemesi metin
 *    seçimini bozmamalı; PTR bir dokunma deyimidir).
 *  - Kaydırma konteyneri en tepedeyken (scrollTop <= 0) ve aşağı-yukarı baskın
 *    harekette jest "talep edilir" (touchmove preventDefault ile yerel
 *    kaydırma engellenir); aksi her durumda normal kaydırma hiç bozulmaz.
 *  - Kaydırarak yukarı gelen parmak için başlangıç noktası sürekli yeniden
 *    demirlemir — tepede aniden devPull mesafesi birikmez (yanlış tetik yok).
 *  - Eşik aşılırsa `onRefresh` await edilir; aksi halde sessizce sıfırlanır.
 *  - `onRefresh` latest-ref ile saklanır (F5.4 kuralı: stale-callback render
 *    kapanmadan güncel kalır).
 */
export const usePullToRefresh = (
  container: HTMLElement | null,
  onRefresh: () => Promise<unknown> | void,
  options?: PullToRefreshOptions,
): PullToRefreshState => {
  const threshold = options?.threshold ?? 72;
  const maxPull = options?.maxPull ?? 120;
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const onRefreshRef = React.useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  React.useEffect(() => {
    if (!container) return;
    const startRef = { x: 0, y: 0 };
    const claimedRef = { current: false };
    const refreshingRef = { current: false };

    const anchorTo = (touch: Touch): void => {
      startRef.x = touch.clientX;
      startRef.y = touch.clientY;
      claimedRef.current = false;
      setPullDistance(0);
    };

    const onTouchStart = (event: TouchEvent): void => {
      const touch = event.touches[0];
      if (!touch || refreshingRef.current || event.touches.length !== 1) {
        return;
      }
      startRef.x = touch.clientX;
      startRef.y = touch.clientY;
      claimedRef.current = false;
    };

    const onTouchMove = (event: TouchEvent): void => {
      const touch = event.touches[0];
      if (!touch) return;
      if (refreshingRef.current) {
        event.preventDefault();
        return;
      }
      if (container.scrollTop > 0) {
        // Normal kaydırma: başlangıcı takip et, jesti talep etme.
        anchorTo(touch);
        return;
      }
      if (!claimedRef.current) {
        const deltaY = touch.clientY - startRef.y;
        const deltaX = touch.clientX - startRef.x;
        if (deltaY < 6 || Math.abs(deltaY) < Math.abs(deltaX)) {
          anchorTo(touch);
          return;
        }
        // Aşağı-çekim doğrulandı: jest artık bizim (kaydırma kilitlenir).
        claimedRef.current = true;
      }
      const deltaY = touch.clientY - startRef.y;
      const damped = Math.round(Math.min(maxPull, deltaY * 0.55));
      if (damped >= threshold) {
        setPullDistance(0);
        claimedRef.current = false;
        refreshingRef.current = true;
        setIsRefreshing(true);
        void selectionHaptic();
        void Promise.resolve()
          .then(() => onRefreshRef.current())
          .catch(() => { /* ağ hatası yüzeyi ekranlarda / OfflineBanner'dadır */ })
          .finally(() => {
            refreshingRef.current = false;
            setIsRefreshing(false);
          });
        return;
      }
      event.preventDefault();
      setPullDistance(Math.max(0, damped));
    };

    const onTouchEnd = (): void => {
      claimedRef.current = false;
      setPullDistance(0);
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [container, threshold, maxPull]);

  return { pullDistance, isRefreshing };
};
