import { appStorage, setStorageDiagnosticsListener } from '../repositories/storageRepository';

const STORAGE_KEY = 'skyview_diagnostics_v1';
const MAX_ENTRIES = 80;
const SENSITIVE_KEY = /latitude|longitude|location|token|secret|api.?key|url|body/i;
const sanitizeText = (value: unknown): string => String(value)
  .replace(/https?:\/\/\S+/gi, '[url]')
  .replace(/([?&](?:api_?key|token)=)[^&\s]+/gi, '$1[redacted]')
  .slice(0, 120);

export type DiagnosticLevel = 'info' | 'warning' | 'error';

export interface DiagnosticEntry {
  id: string;
  level: DiagnosticLevel;
  category: 'performance' | 'network' | 'ui' | 'runtime';
  name: string;
  timestamp: number;
  details?: Record<string, string | number | boolean | null>;
}

const sanitizeDetails = (details?: Record<string, unknown>): DiagnosticEntry['details'] => {
  if (!details) return undefined;
  return Object.fromEntries(
    Object.entries(details)
      .filter(([key]) => !SENSITIVE_KEY.test(key))
      .slice(0, 12)
      .map(([key, value]) => {
        if (typeof value === 'number') return [key, Number.isFinite(value) ? Math.round(value * 10) / 10 : null];
        if (typeof value === 'boolean' || value === null) return [key, value];
        return [key, sanitizeText(value)];
      }),
  );
};

export const recordDiagnostic = (
  level: DiagnosticLevel,
  category: DiagnosticEntry['category'],
  name: string,
  details?: Record<string, unknown>,
): void => {
  const entries = appStorage.getJson<DiagnosticEntry[]>(STORAGE_KEY, []);
  entries.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level,
    category,
    name: name.slice(0, 100),
    timestamp: Date.now(),
    details: sanitizeDetails(details),
  });
  appStorage.setJson(STORAGE_KEY, entries.slice(-MAX_ENTRIES));
};

export const captureException = (
  error: unknown,
  category: DiagnosticEntry['category'] = 'runtime',
  context?: Record<string, unknown>,
): void => {
  const value = error instanceof Error ? error : new Error(String(error));
  recordDiagnostic('error', category, value.name || 'Error', {
    ...context,
    message: value.message.slice(0, 160),
  });
};

export const getDiagnosticsSnapshot = (): DiagnosticEntry[] => (
  appStorage.getJson<DiagnosticEntry[]>(STORAGE_KEY, [])
);

/**
 * storageRepository düşüşlerini (bozuk JSON, native-init/native yazma hataları)
 * dairesel import yaratmadan diagnostics almanağına bağlar.
 * not: STORAGE_KEY'e geri besleme — recordDiagnostic kendi almanak yazımı da
 * getJson/setJson'a düşerse sonsuz özyineleme doğurur; kendi anahtarını yoksayar.
 */
export const installStorageDiagnostics = (): (() => void) => {
  setStorageDiagnosticsListener(event => {
    if (event.key === STORAGE_KEY) return;
    recordDiagnostic(event.severity, 'runtime', `storage.${event.name}`, {
      key: event.key ?? null,
      detail: event.detail,
    });
  });
  return () => setStorageDiagnosticsListener(null);
};

export const installGlobalObservability = (): (() => void) => {
  const onError = (event: ErrorEvent) => captureException(event.error || event.message, 'runtime');
  const onRejection = (event: PromiseRejectionEvent) => captureException(event.reason, 'runtime', { type: 'unhandled-rejection' });
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);

  const uninstallStorageDiagnostics = installStorageDiagnostics();

  let observer: PerformanceObserver | null = null;
  try {
    observer = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        if (entry.duration >= 100) recordDiagnostic('warning', 'performance', 'long-task', { duration: entry.duration });
      });
    });
    observer.observe({ entryTypes: ['longtask'] });
  } catch {
    observer = null;
  }

  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
    observer?.disconnect();
    uninstallStorageDiagnostics();
  };
};
