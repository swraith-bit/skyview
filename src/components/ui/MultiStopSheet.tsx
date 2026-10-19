import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { acquireModalScrollLock } from '../../utils/modalScrollLock';

export type SheetStop = 'peek' | 'half' | 'full';

const STOP_RATIO: Record<SheetStop, number> = { peek: 0.26, half: 0.56, full: 0.92 };
const MIN_HEIGHT = 176;

const stopHeight = (stop: SheetStop): number => {
  if (typeof window === 'undefined') return 480;
  return Math.max(MIN_HEIGHT, Math.round(window.innerHeight * STOP_RATIO[stop]));
};

const nearestStop = (height: number): SheetStop => {
  const candidates: SheetStop[] = ['peek', 'half', 'full'];
  return candidates.reduce((best, stop) =>
    Math.abs(stopHeight(stop) - height) < Math.abs(stopHeight(best) - height) ? stop : best,
    'half' as SheetStop);
};

/**
 * TUR 2 — Çok Duraklı Draggable BottomSheet.
 *
 * Tam ekran modal yerine üç durak: peek (başlık + yön), half (yükseklik eğrisi,
 * optik önerisi), full (efemeris + notlar). Tutamaç sürüklenebilir; tıklama da
 * duraklar arasında döner. Odak tuzağı, geri tuşu ve kaydırma kilidi mevcut
 * modal altyapısıyla aynı sözleşmeyi korur.
 */
export const MultiStopSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  initialStop?: SheetStop;
  expandLabel: string;
  collapseLabel: string;
  children: ReactNode;
}> = ({ open, onClose, ariaLabel, initialStop = 'half', expandLabel, collapseLabel, children }) => {
  const [stop, setStop] = useState<SheetStop>(initialStop);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const dragRef = useRef<{ startY: number; startHeight: number; moved: boolean } | null>(null);
  const [panelEl, setPanelEl] = useState<HTMLDivElement | null>(null);

  useModalBackHandler(open, onClose);
  useFocusTrap(panelEl, open, onClose);

  useEffect(() => {
    if (!open) return;
    setStop(initialStop);
    setDragHeight(null);
    return acquireModalScrollLock();
  }, [open, initialStop]);

  const cycleStop = useCallback(() => {
    // Sürükleme sonrası gelen tıklama durağı istemsizce değiştirmesin.
    if (dragRef.current?.moved) {
      dragRef.current = null;
      return;
    }
    setStop(previous => previous === 'peek' ? 'half' : previous === 'half' ? 'full' : 'half');
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startY: event.clientY, startHeight: dragHeight ?? stopHeight(stop), moved: false };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    const delta = dragRef.current.startY - event.clientY;
    if (Math.abs(delta) > 6) dragRef.current.moved = true;
    const next = Math.max(MIN_HEIGHT, Math.min(stopHeight('full'), dragRef.current.startHeight + delta));
    setDragHeight(next);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const finalHeight = dragHeight ?? dragRef.current.startHeight;
    setStop(nearestStop(finalHeight));
    setDragHeight(null);
    // moved flag'i click temizlesin (pointerup click'ten önce koşar).
    if (!dragRef.current.moved) dragRef.current = null;
  };

  if (typeof document === 'undefined' || !open) return null;

  const height = dragHeight ?? stopHeight(stop);

  return createPortal(
    <div className="fixed inset-0 z-[160] flex items-end bg-black/60 backdrop-blur-sm sv-modal-in" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        ref={setPanelEl}
        onClick={event => event.stopPropagation()}
        style={{ height }}
        className="sv-modal-sheet-in mx-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border-t border-white/10 bg-app-surface shadow-[0_-18px_50px_rgba(0,0,0,0.55)]"
      >
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={cycleStop}
          aria-label={stop === 'full' ? collapseLabel : expandLabel}
          className="flex w-full shrink-0 cursor-grab touch-none flex-col items-center gap-1 pb-1 pt-2.5 outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:cursor-grabbing"
        >
          <span className="h-1.5 w-11 rounded-full bg-slate-500/60" aria-hidden="true" />
          <span className="flex items-center gap-1 text-2xs font-medium text-slate-500">
            {stop === 'full' ? <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />}
            {stop === 'full' ? collapseLabel : expandLabel}
          </span>
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-safe-area">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};
