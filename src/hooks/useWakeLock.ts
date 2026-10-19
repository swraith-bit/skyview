import { useEffect, useState } from 'react';

export const useWakeLock = (enabled: boolean): { supported: boolean; active: boolean } => {
  const supported = typeof navigator !== 'undefined' && Boolean(navigator.wakeLock);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!enabled || !supported) {
      setActive(false);
      return;
    }
    let handle: WakeLockSentinel | null = null;
    let mounted = true;

    const dropSentinel = () => {
      // The system auto-releases the sentinel after screen lock / visibility loss
      // (F1.2). Clearing the handle here lets visibility change reacquire it.
      handle = null;
      if (mounted) setActive(false);
    };

    const acquire = async () => {
      if (document.visibilityState !== 'visible' || handle) return;
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        if (!mounted) {
          void sentinel.release().catch(() => undefined);
          return;
        }
        handle = sentinel;
        sentinel.addEventListener('release', dropSentinel);
        setActive(true);
      } catch {
        if (mounted) setActive(false);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !handle) void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', onVisibility);
      handle?.removeEventListener('release', dropSentinel);
      void handle?.release().catch(() => undefined);
      handle = null;
      setActive(false);
    };
  }, [enabled, supported]);

  return { supported, active };
};
