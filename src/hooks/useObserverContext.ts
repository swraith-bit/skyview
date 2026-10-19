import { useEffect, useMemo, useState } from 'react';
import { createObserverContext, ObserverContext } from '../domain/observerContext';
import { LocationData } from '../types';

// F3.1: pure decision for the minute ticker — hidden documents skip work
// entirely and an unchanged minute never re-renders observers downstream
// (which previously woke useTonightTargets on every tick). A missing document
// (node/SSR) is treated as visible.
export const isMinuteTickDue = (
  nowMs: number,
  lastMinute: number,
  visibilityState: string | undefined,
): boolean => {
  if (visibilityState !== undefined && visibilityState !== 'visible') return false;
  return Math.floor(nowMs / 60_000) !== lastMinute;
};

export const useObserverContext = (location: LocationData): ObserverContext => {
  const [instant, setInstant] = useState(() => new Date());

  useEffect(() => {
    setInstant(new Date());
    let lastMinute = Math.floor(Date.now() / 60_000);
    const tick = () => {
      const now = new Date();
      const visibilityState = typeof document === 'undefined' ? undefined : document.visibilityState;
      if (!isMinuteTickDue(now.getTime(), lastMinute, visibilityState)) return;
      lastMinute = Math.floor(now.getTime() / 60_000);
      setInstant(now);
    };
    const interval = window.setInterval(tick, 60_000);
    const handleVisibilityChange = () => tick();
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearInterval(interval);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.latitude, location.longitude, location.timezone]);

  return useMemo(
    () => createObserverContext(location, { now: () => instant }),
    [instant, location],
  );
};
