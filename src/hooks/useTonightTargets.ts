import { useEffect, useState } from 'react';
import { HourlyData, TonightTarget } from '../types';
import { getTonightTargets } from '../utils/astronomy';
import { recordPerformanceMetric } from '../utils/performanceMonitor';
import { ObserverContext } from '../domain/observerContext';
import { requestTonightTargetsFromWorker } from '../workers/astronomyWorkerClient';

export const useTonightTargets = (
  observer: ObserverContext,
  weather: number | HourlyData,
): { targets: TonightTarget[]; loading: boolean } => {
  const [targets, setTargets] = useState<TonightTarget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let cancelFallback: (() => void) | null = null;
    const startedAt = performance.now();
    setLoading(true);
    const runFallback = (metricName: string) => {
      const fallbackTimer = window.setTimeout(() => {
        if (!active) return;
        setTargets(getTonightTargets(observer.instant, observer.latitude, observer.longitude, weather));
        setLoading(false);
        recordPerformanceMetric(metricName, performance.now() - startedAt);
      }, 0);
      return () => {
        window.clearTimeout(fallbackTimer);
      };
    };

    // F3.1: the worker is a module-scope singleton — this effect only posts a
    // request and no longer births/terminates a Worker on every minute tick.
    const cancelRequest = requestTonightTargetsFromWorker(
      {
        date: observer.instant.toISOString(),
        latitude: observer.latitude,
        longitude: observer.longitude,
        weather,
      },
      response => {
        if (!active) return;
        const normalized = response.map(target => ({
          ...target,
          bestTime: new Date(target.bestTime),
          altitudePoints: target.altitudePoints.map(point => ({ ...point, time: new Date(point.time) })),
        }));
        setTargets(normalized);
        setLoading(false);
        recordPerformanceMetric('tonight-targets-worker', performance.now() - startedAt);
      },
      () => {
        if (!active) return;
        cancelFallback = runFallback('tonight-targets-worker-fallback');
      },
    );
    return () => {
      active = false;
      cancelRequest();
      if (cancelFallback) cancelFallback();
    };
  }, [observer.instant, observer.latitude, observer.longitude, weather]);

  return { targets, loading };
};
