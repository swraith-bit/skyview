import { describe, expect, it, vi } from 'vitest';
import { attachFocusTrap, FocusTrapContainer, FocusTrapDocument } from './useFocusTrap';

type FakeListener = (event: KeyboardEvent) => void;

const createDoc = () => {
  const keydownListeners = new Set<FakeListener>();
  const raw = {
    addEventListener: (type: string, listener: FakeListener) => {
      if (type === 'keydown') keydownListeners.add(listener);
    },
    removeEventListener: (type: string, listener: FakeListener) => {
      keydownListeners.delete(listener);
    },
    activeElement: null as Element | null,
    emit: (event: { key: string; shiftKey?: boolean }) => {
      for (const listener of [...keydownListeners]) {
        listener({ preventDefault: vi.fn(), ...event } as unknown as KeyboardEvent);
      }
    },
  };
  // Testler activeElement'i mutate eder; FocusTrapDocument yüzeyi okuma amaçlıdır.
  return {
    raw,
    doc: raw as FocusTrapDocument & { emit(event: { key: string; shiftKey?: boolean }): void },
  };
};

const fakeElement = () => {
  const focus = vi.fn();
  return { element: { focus } as unknown as HTMLElement, focus };
};

const createContainer = (focusables: HTMLElement[]) =>
  ({
    querySelectorAll: () => focusables,
    contains: () => false,
  }) as unknown as FocusTrapContainer;

describe('attachFocusTrap (F5.4 focus triade)', () => {
  it('focuses the first focusable exactly once on attach', () => {
    const { doc } = createDoc();
    const first = fakeElement();
    const second = fakeElement();
    const detach = attachFocusTrap(doc, createContainer([first.element, second.element]), () => {});

    expect(first.focus).toHaveBeenCalledTimes(1);
    expect(second.focus).not.toHaveBeenCalled();

    detach();
  });

  it('cycles Tab into the container and wraps backward on Shift+Tab', () => {
    const { doc } = createDoc();
    const first = fakeElement();
    const second = fakeElement();
    const detach = attachFocusTrap(doc, createContainer([first.element, second.element]), () => {});

    // contains() stub'u false döndürdükçe odak "kabın dışında" sayılır:
    // Tab → başa sarmalı, Shift+Tab → sona sarmalı.
    doc.emit({ key: 'Tab' });
    doc.emit({ key: 'Tab', shiftKey: true });

    expect(first.focus).toHaveBeenCalledTimes(2);
    expect(second.focus).toHaveBeenCalledTimes(1);

    detach();
  });

  it('runs the attached onClose once per Escape press with preventDefault', () => {
    const { raw } = createDoc();
    const onClose = vi.fn();
    const keydownListeners: FakeListener[] = [];
    const spyDoc = {
      ...raw,
      addEventListener: (type: string, listener: FakeListener) => {
        if (type === 'keydown') keydownListeners.push(listener);
      },
      removeEventListener: (type: string, listener: FakeListener) => {
        const index = keydownListeners.indexOf(listener);
        if (index !== -1) keydownListeners.splice(index, 1);
      },
    } as unknown as FocusTrapDocument;

    const detach = attachFocusTrap(spyDoc, createContainer([fakeElement().element]), onClose);
    const event = { key: 'Escape', preventDefault: vi.fn() } as unknown as KeyboardEvent;
    for (const listener of [...keydownListeners]) listener(event);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);

    detach();
    expect(keydownListeners).toHaveLength(0);
  });

  it('restores the previously focused element on detach', () => {
    const { raw, doc } = createDoc();
    const outer = fakeElement();
    raw.activeElement = outer.element;

    const detach = attachFocusTrap(doc, createContainer([fakeElement().element]), () => {});
    expect(outer.focus).not.toHaveBeenCalled();

    detach();
    expect(outer.focus).toHaveBeenCalledTimes(1);
  });

  it('is a harmless no-op without a container', () => {
    const { doc } = createDoc();
    const onClose = vi.fn();
    const detach = attachFocusTrap(doc, null, onClose);

    expect(typeof detach).toBe('function');
    detach();
    expect(onClose).not.toHaveBeenCalled();
  });
});
