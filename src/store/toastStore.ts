/**
 * F6.2 — Standart Toast durum katmanı.
 *
 * Framework-bağımsız küçük pub-sub istasyonu: React'e özel bağımlılığı yok;
 * `ui/Toast.tsx` `useSyncExternalStore` üzerinden abone olur, native/pragmatik
 * akarlar ise doğrudan `showToast` çağırır. Eski dashboard içi `[msg, setMsg]`
 * pattern'leri (MeteorShowers/ISSTracker) tek kanal üzerinde birleşir.
 *
 * Print döngüsü: ekran → `duration` (varsayılan 3s) → `exiting=true`
 * (`sv-toast-out` oynar, index.css'te 180ms) → kimlik listeden düşer.
 * Aynı anda en fazla `MAX_TOASTS` toast görünür; fazla gelen, en eskiyi
 * düşürür (kanal-benzeri davranış).
 */
export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export type ToastOptions = {
  /** ms cinsinden görünüm süresi; varsayılan DEFAULT_TOAST_DURATION. */
  duration?: number;
  variant?: ToastVariant;
};

export type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
  exiting: boolean;
};

export const DEFAULT_TOAST_DURATION = 3000;
export const MAX_TOASTS = 3;
/** index.css `.sv-toast-out` animasyon süresiyle senkron. */
export const TOAST_EXIT_MS = 180;

let nextId = 1;
let items: ToastItem[] = [];
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

const emit = () => {
  listeners.forEach(listener => listener());
};

export const subscribeToasts = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getToasts = (): ToastItem[] => items;

function clearTimer(id: number) {
  const timer = timers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    timers.delete(id);
  }
}

function dropToast(id: number) {
  items = items.filter(item => item.id !== id);
}

function removeToast(id: number) {
  const item = items.find(entry => entry.id === id);
  if (!item) return;
  dropToast(id);
  clearTimer(id);
  emit();
}

function beginExit(id: number, delayMs = TOAST_EXIT_MS) {
  const item = items.find(entry => entry.id === id);
  if (!item || item.exiting) return;
  item.exiting = true;
  emit();
  clearTimer(id);
  timers.set(id, setTimeout(() => removeToast(id), delayMs));
}

/** Toast kanalına yeni bildirim düşürür; kimliği (id) döner. */
export function showToast(message: string, options: ToastOptions = {}): number {
  const id = nextId;
  nextId += 1;
  const item: ToastItem = {
    id,
    message,
    variant: options.variant ?? 'info',
    duration: options.duration ?? DEFAULT_TOAST_DURATION,
    exiting: false,
  };
  items = [...items, item];
  clearTimer(id);
  timers.set(id, setTimeout(() => beginExit(id), item.duration));
  // Kapasite aşıldıysa en eskisini (çıkışta olanlar dahil) düşür.
  while (items.length > MAX_TOASTS) {
    const oldest = items[0]!;
    items = items.slice(1);
    dropToast(oldest.id);
    clearTimer(oldest.id);
  }
  emit();
  return id;
}

/** Toast'u kullanıcı isteğiyle kapatır (çıkış animasyonuyla). */
export function dismissToast(id: number): void {
  beginExit(id);
}

/** Test/teardown yardımcısı: tüm bekleyen toast ve zamanlayıcıları temizler. */
export function resetToasts(): void {
  timers.forEach(timer => clearTimeout(timer));
  timers.clear();
  items = [];
  emit();
}
