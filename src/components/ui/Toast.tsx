import React, { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { getToasts, subscribeToasts, ToastItem, ToastVariant } from '../../store/toastStore';

/**
 * F6.2 — Standart Toast sunumu (Modal.tsx'in taban kuralını izler):
 *
 *  - Koşullu render yerine hep-mounted portal: `exiting` bayrağı dönene kadar
 *    öğe DOM'da kalır, `sv-toast-out` animasyonu tam oynar; unmount
 *    zamanlaması toastStore'un TOAST_EXIT_MS sözleşmesindedir.
 *  - `role="status"` + `aria-live="polite"`: ekran okuyucu kesintiye girmeden
 *    bildirimi duyurur; odak çalınmaz (toast odak-isteyen bir kontrol değildir).
 *  - Tonlar F6.1 bilgi/başarı/uyarı/tehlike token'larına bağlanır
 *    (text-app-info vs.); konum safe-area'lı tepedir, pointer-events dışı
 *    shell + ic içerik kullanıcı dokunuşu alır.
 *  - `sv-toast-in`/`sv-toast-out` keyframe sınıfları index.css'tedir;
 *    prefers-reduced-motion genel kuralı süreyi kısaltır.
 */

const TOAST_TONE: Record<ToastVariant, { Icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  info: { Icon: Info, tone: 'text-app-info' },
  success: { Icon: CheckCircle, tone: 'text-app-success' },
  warning: { Icon: AlertTriangle, tone: 'text-app-warning' },
  danger: { Icon: XCircle, tone: 'text-app-danger' },
};

const ToastCard: React.FC<{ item: ToastItem }> = ({ item }) => {
  const { Icon, tone } = TOAST_TONE[item.variant];
  return (
    <div
      role="status"
      aria-live="polite"
      data-exiting={item.exiting || undefined}
      className={`pointer-events-auto flex max-w-[min(92%,24rem)] items-center gap-2 rounded-xl border border-white/5 bg-app-panel/90 px-3 py-2.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md ${item.exiting ? 'sv-toast-out' : 'sv-toast-in'}`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${tone}`} />
      <span className="min-w-0 flex-1 leading-snug">{item.message}</span>
    </div>
  );
};

export const ToastHost: React.FC = () => {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts);
  if (toasts.length === 0 || typeof document === 'undefined') return null;
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[250] flex flex-col items-center gap-2 px-4 pt-safe-area">
      {toasts.map(item => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>,
    document.body,
  );
};
