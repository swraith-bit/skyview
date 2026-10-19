import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TimeMachineContext,
  TimeMachineValue,
  clampOffsetMinutes,
  shiftInstant,
} from './timeMachineCore';

/**
 * TUR 2 — Global Zaman Ekseni sağlayıcısı.
 *
 * Tek bir saat ofseti tüm bağlı ekranları sürer: Bugün kararı, hedef listesi,
 * karanlık pencere ve gece şeridi aynı imleci paylaşır. Ofset geçicidir
 * (kalıcı değil) — uygulama yeniden açıldığında "şimdi"ye döner.
 */
export const TimeMachineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [now, setNow] = useState(() => new Date());
  const [offsetMinutes, setOffsetState] = useState(0);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = window.setInterval(tick, 60_000);
    const handleVisibility = () => tick();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const setOffsetMinutes = useCallback((minutes: number) => {
    setOffsetState(clampOffsetMinutes(minutes));
  }, []);

  const shiftBy = useCallback((deltaMinutes: number) => {
    setOffsetState(previous => clampOffsetMinutes(previous + deltaMinutes));
  }, []);

  const reset = useCallback(() => setOffsetState(0), []);

  const value = useMemo<TimeMachineValue>(() => ({
    now,
    offsetMinutes,
    instant: shiftInstant(now, offsetMinutes),
    isShifted: offsetMinutes > 0,
    setOffsetMinutes,
    shiftBy,
    reset,
  }), [now, offsetMinutes, setOffsetMinutes, shiftBy, reset]);

  return <TimeMachineContext.Provider value={value}>{children}</TimeMachineContext.Provider>;
};
