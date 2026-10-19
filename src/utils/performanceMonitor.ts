const MAX_METRICS = 40;
import { recordDiagnostic } from '../observability/diagnostics';
const metrics: Array<{ name: string; duration: number; recordedAt: number }> = [];

export const recordPerformanceMetric = (name: string, duration: number): void => {
  if (!Number.isFinite(duration) || duration < 0) return;
  metrics.push({ name, duration: Math.round(duration * 10) / 10, recordedAt: Date.now() });
  recordDiagnostic('info', 'performance', name, { duration });
  if (metrics.length > MAX_METRICS) metrics.splice(0, metrics.length - MAX_METRICS);
};

export const getPerformanceMetrics = () => [...metrics];

export const markAppReady = (): void => {
  if (typeof performance === 'undefined') return;
  try {
    performance.mark('skyview-app-ready');
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) recordPerformanceMetric('app-ready', performance.now());
  } catch {
    // Performance metrics must never affect app startup.
  }
};
