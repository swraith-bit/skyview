import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_TOAST_DURATION,
  MAX_TOASTS,
  TOAST_EXIT_MS,
  dismissToast,
  getToasts,
  resetToasts,
  showToast,
  subscribeToasts,
} from './toastStore';

describe('toast channel (F6.2)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetToasts();
  });

  afterEach(() => {
    resetToasts();
    vi.useRealTimers();
  });

  it('emits and exposes a new toast with defaults', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToasts(listener);
    showToast('test message');
    expect(listener).toHaveBeenCalled();
    const toasts = getToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({
      message: 'test message',
      variant: 'info',
      duration: DEFAULT_TOAST_DURATION,
      exiting: false,
    });
    unsubscribe();
  });

  it('marks the toast exiting after its duration and removes it after the exit window', () => {
    showToast('auto dismiss');
    vi.advanceTimersByTime(DEFAULT_TOAST_DURATION);
    expect(getToasts()).toHaveLength(1);
    expect(getToasts()[0]!.exiting).toBe(true);

    vi.advanceTimersByTime(TOAST_EXIT_MS);
    expect(getToasts()).toHaveLength(0);
  });

  it('respects a custom duration', () => {
    showToast('quick', { duration: 50 });
    vi.advanceTimersByTime(49);
    expect(getToasts()[0]!.exiting).toBe(false);
    vi.advanceTimersByTime(1);
    expect(getToasts()[0]!.exiting).toBe(true);
  });

  it('keeps at most MAX_TOASTS active toasts, dropping the oldest', () => {
    for (let i = 0; i < MAX_TOASTS + 2; i += 1) {
      showToast(`toast ${i}`);
    }
    const toasts = getToasts();
    expect(toasts).toHaveLength(MAX_TOASTS);
    expect(toasts[0]!.message).toBe(`toast ${2}`);
    expect(toasts[MAX_TOASTS - 1]!.message).toBe(`toast ${MAX_TOASTS + 1}`);
  });

  it('dismissToast starts the exit phase immediately', () => {
    const id = showToast('manual close');
    expect(getToasts()[0]!.exiting).toBe(false);
    dismissToast(id);
    expect(getToasts()[0]!.exiting).toBe(true);
    vi.advanceTimersByTime(TOAST_EXIT_MS);
    expect(getToasts()).toHaveLength(0);
  });

  it('supports variant passthrough for tone styling', () => {
    showToast('ok', { variant: 'success' });
    showToast('warn', { variant: 'warning' });
    showToast('err', { variant: 'danger' });
    expect(getToasts().map(item => item.variant)).toEqual(['success', 'warning', 'danger']);
  });

  it('scheduler latency does not double-fire removal', () => {
    const id = showToast('stable');
    vi.advanceTimersByTime(DEFAULT_TOAST_DURATION + TOAST_EXIT_MS);
    expect(getToasts()).toHaveLength(0);
    expect(() => dismissToast(id)).not.toThrow();
    expect(getToasts()).toHaveLength(0);
  });
});
