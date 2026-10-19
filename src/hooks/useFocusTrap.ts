import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Test edilebilir minimum yüzey (gerçek `document`/`HTMLElement` ile yapısal uyumlu). */
export type FocusTrapDocument = Pick<
  Document,
  'addEventListener' | 'removeEventListener' | 'activeElement'
>;
export type FocusTrapContainer = {
  querySelectorAll<E = HTMLElement>(selector: string): ArrayLike<E>;
  contains(node: unknown): boolean;
};

/**
 * F6/F5.4 çekirdeği: tuzak kabına tab-döngüsü + ESC bağlar. Kod biçiminde arkada
 * kalan önceki odak restore edilir; effect lifetime başına tam bir abonelik
 * yapılır (§5: modal açıkken her render'da dinleyici yeniden kurulmaz).
 */
export function attachFocusTrap(
  doc: FocusTrapDocument,
  container: FocusTrapContainer | null,
  onClose?: () => void,
): () => void {
  if (!container) return () => {};
  // DOM lib'de `focus` yalnızca HTMLElement/SVGElement'tedir; runtime'da duck-typing
  // ile bakılır (test sahteleri de bu şekli uygular).
  const active = doc.activeElement as HTMLElement | null;
  const previouslyFocused = active && typeof active.focus === 'function' ? active : null;
  const getFocusableElements = (): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

  const focusables = getFocusableElements();
  const firstFocusable = focusables[0];
  if (firstFocusable && !container.contains(doc.activeElement)) {
    firstFocusable.focus();
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (onClose) {
        event.preventDefault();
        onClose();
      }
      return;
    }

    if (event.key !== 'Tab') return;
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    const first = elements[0]!;
    const last = elements[elements.length - 1]!;
    const activeEl = doc.activeElement;

    if (event.shiftKey) {
      if (activeEl === first || !container.contains(activeEl)) {
        event.preventDefault();
        last.focus();
      }
    } else if (activeEl === last || !container.contains(activeEl)) {
      event.preventDefault();
      first.focus();
    }
  };

  doc.addEventListener('keydown', handleKeyDown);
  return () => {
    doc.removeEventListener('keydown', handleKeyDown);
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
  };
}

export const useFocusTrap = (
  container: HTMLElement | null,
  active: boolean,
  onClose?: () => void,
): void => {
  // F5.4: latest-ref — inline `onClose` artık tuzak aboneliğini yeniden kurmuyor;
  // her render'da önceki odağın kapat düğmesine geri zıplaması (§5 churn
  // bulgusunun yan etkisi) bitti.
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Container, callback-ref ile state olarak beslenir: portal/panelin commit'i
  // ile effect zamanlaması ayrışamaz (koşullu render'larda `RefObject.current`
  // güvenilmez — lazy içerikte ilk koşuda null kalabilir).
  useEffect(() => {
    if (!active || !container || typeof document === 'undefined') return;
    return attachFocusTrap(document, container, () => onCloseRef.current?.());
  }, [active, container]);
};
