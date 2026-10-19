import React, { ReactNode, Suspense, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { acquireModalScrollLock } from '../../utils/modalScrollLock';

/**
 * F5.4 (= F6.2 tek kurulumu) — Standart Modal/BottomSheet.
 *
 * Tek taban üstünde: focus triade (`useFocusTrap` latest-ref), ESC, `aria-modal`,
 * gövde kaydırma kilidi, donanım geri-tuşu kaydı (F5.3 tek geçiş) ve CSS
 * keyframe ile tam oynan giriş/çıkış animasyonu (`svModal*` keyframe'leri +
 * çıkış unmount timer'ı). `AnimatePresence` burada kullanılmaz — motion paketi
 * ilk-yükleme zincirine çekilmesin (F6.2 yerine audit §6 perf bütçesi); çıkış
 * animasyonu koşullu portal desenine rağmen tam oynar: portal hep mounted,
 * `present` yalnızca animasyon bitince sökülür.
 *
 * Variantlar:
 *  - center     : arka plan bulanıklıklı ortalanmış diyalog (ARSkyMap arama/kalibrasyon)
 *  - sheet      : alttan kayan bottom sheet (günlük formu); varsayılan olarak
 *                 overlay-dış tıklamayla kapanır
 *  - fullscreen : tam ekran yığın (gök cismi detayı, ışık kirliliği haritası);
 *                 arka plan rengini tüketici `panelClassName` ile verir
 *  - lightbox   : APOD lightbox; gece-modu katmanının (z-100000) altında kalır
 */
export type ModalVariant = 'center' | 'sheet' | 'fullscreen' | 'lightbox';

const DEFAULT_Z: Record<ModalVariant, number> = {
  center: 100,
  sheet: 150,
  fullscreen: 150,
  lightbox: 99999,
};

/** index.css'teki `svModal*` keyframe süreleriyle aynı; çıkış unmount timer'ı bunlara bağlanır. */
const EXIT_MS: Record<ModalVariant, number> = {
  center: 180,
  sheet: 240,
  fullscreen: 160,
  lightbox: 160,
};

const CENTER_PANEL_DEFAULT =
  'bg-slate-900 border border-white/5 rounded-xl shadow-sm overflow-hidden flex flex-col';
const SHEET_PANEL_DEFAULT =
  'w-full mx-auto rounded-t-2xl border-t border-white/10 bg-slate-950 shadow-sm';

/**
 * Kapı durum makinesi: `open` false'a düşse bile DOMda kalıp çıkış animasyonunu
 * oynatır; süre sonunda `present=false` olur ve portal içeriği sökülür.
 */
const useExitPresence = (open: boolean, exitMs: number): { present: boolean; closing: boolean } => {
  const [state, setState] = useState({ present: open, closing: false });

  useEffect(() => {
    if (open) {
      setState({ present: true, closing: false });
      return;
    }
    setState(previous => (previous.present ? { present: true, closing: true } : previous));
  }, [open]);

  useEffect(() => {
    if (!state.closing) return;
    const reduce = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setState({ present: false, closing: false }), reduce ? 0 : exitMs);
    return () => window.clearTimeout(timer);
  }, [state.closing, exitMs]);

  return { present: state.present, closing: state.closing };
};

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  variant?: ModalVariant;
  /** Katman sırası; geçmiş z değerleriyle birebir korumak için geçilebilir. */
  z?: number;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  panelClassName?: string;
  /** Varsayılan: yalnızca sheet'te `true` (overlay-dış tıklama kapatır). */
  closeOnBackdrop?: boolean;
  children: ReactNode;
};

export const StandardModal: React.FC<ModalProps> = ({
  open,
  onClose,
  variant = 'center',
  z,
  ariaLabel,
  ariaLabelledBy,
  panelClassName = '',
  closeOnBackdrop,
  children,
}) => {
  const effectiveZ = z ?? DEFAULT_Z[variant];
  const backdropCloses = closeOnBackdrop ?? variant === 'sheet';
  // Panel DOM'u callback-ref ile state'e bağlanır: eau panel koşullu/portal
  // render'da da olsa commit edilince effect'lerin container'ı netleşir.
  const [panelEl, setPanelEl] = useState<HTMLDivElement | null>(null);
  const { present, closing } = useExitPresence(open, EXIT_MS[variant]);

  // F5.3: geri tuşu kaydı modal tabanında tek geçişte yapılır.
  useModalBackHandler(open, onClose);

  useEffect(() => {
    if (!open) return;
    return acquireModalScrollLock();
  }, [open]);

  // Odak tuzağı, panel dalışında gerçekten DOM'da olunca devreye girer:
  // lazy (Suspense) içerikte ilk focusable "hiç" (fallback) geldiğinde effect
  // yeniden koşmaz riskinden callback-ref deseni korunur.
  useFocusTrap(panelEl, open && present, onClose);

  const ariaProps = ariaLabelledBy
    ? { 'aria-labelledby': ariaLabelledBy }
    : { 'aria-label': ariaLabel };

  const shellAnimation = closing ? 'sv-modal-out' : 'sv-modal-in';

  if (typeof document === 'undefined' || !present) return null;

  return createPortal(
    (variant === 'fullscreen') ? (
      <div
        key="sv-modal-fullscreen"
        role="dialog"
        aria-modal="true"
        {...ariaProps}
        ref={setPanelEl}
        onClick={backdropCloses ? onClose : undefined}
        data-closing={closing || undefined}
        style={{ zIndex: effectiveZ }}
        className={`sv-modal fixed inset-0 overflow-y-auto pt-safe-area pb-safe-area ${shellAnimation} ${panelClassName}`.trim()}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </div>
    ) : (variant === 'lightbox') ? (
      <div
        key="sv-modal-lightbox"
        role="dialog"
        aria-modal="true"
        {...ariaProps}
        ref={setPanelEl}
        onClick={backdropCloses ? onClose : undefined}
        data-closing={closing || undefined}
        style={{ zIndex: effectiveZ }}
        className={`sv-modal fixed inset-0 flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg ${shellAnimation} ${panelClassName}`.trim()}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </div>
    ) : (variant === 'sheet') ? (
      <div
        key="sv-modal-sheet"
        onClick={backdropCloses ? onClose : undefined}
        data-closing={closing || undefined}
        style={{ zIndex: effectiveZ }}
        className={`sv-modal fixed inset-0 flex items-end bg-black/70 backdrop-blur-sm ${shellAnimation}`}
      >
        <div
          role="dialog"
          aria-modal="true"
          {...ariaProps}
          ref={setPanelEl}
          onClick={event => event.stopPropagation()}
          className={`${SHEET_PANEL_DEFAULT} ${closing ? 'sv-modal-sheet-out' : 'sv-modal-sheet-in'} ${panelClassName}`.trim()}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </div>
      </div>
    ) : (
      <div
        key="sv-modal-center"
        onClick={backdropCloses ? onClose : undefined}
        data-closing={closing || undefined}
        style={{ zIndex: effectiveZ }}
        className={`sv-modal fixed inset-0 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md ${shellAnimation}`}
      >
        <div
          role="dialog"
          aria-modal="true"
          {...ariaProps}
          ref={setPanelEl}
          onClick={event => event.stopPropagation()}
          className={`${CENTER_PANEL_DEFAULT} ${closing ? 'sv-modal-panel-out' : 'sv-modal-panel-in'} ${panelClassName}`.trim()}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </div>
      </div>
    ),
    document.body,
  );
};

/** Bottom Sheet; aynı çekirdek kurulumdan beslenen varyant kısayolu (F6.2). */
export const BottomSheet: React.FC<ModalProps> = props => (
  <StandardModal {...props} variant="sheet" />
);
