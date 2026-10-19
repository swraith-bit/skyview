import { useEffect, useRef } from 'react';
import { registerModalForBack } from '../utils/backButtonRegistry';

/**
 * F5.3: StandardModal üzerinden çizilmeyen overlay'ler (ör. AR foto kılavuzu
 * çekmecesi) de açıkken donanım geri tuşuyla kapansın. Close işlevi latest-ref
 * üzerinden okunur; yeniden render'lar yığını yeniden kaydetmez (useFocusTrap
 * §5 churn bulgusuyla aynı desen).
 */
export function useModalBackHandler(active: boolean, close: () => void): void {
  const closeRef = useRef(close);

  useEffect(() => {
    closeRef.current = close;
  });

  useEffect(() => {
    if (!active) return;
    return registerModalForBack(() => closeRef.current());
  }, [active]);
}
