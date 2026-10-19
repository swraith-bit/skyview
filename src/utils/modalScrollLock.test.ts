import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { acquireModalScrollLock, modalScrollLockCount } from './modalScrollLock';

type FakeElement = { style: { overflow: string } };

const createFakeDocument = () => {
  const documentElement = { style: { overflow: '' } } as FakeElement & HTMLElement;
  return { documentElement } as unknown as Document;
};

describe('modal scroll lock (F5.4)', () => {
  beforeEach(() => {
    vi.stubGlobal('document', createFakeDocument());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('locks the document element on the first acquire and restores at zero', () => {
    const release = acquireModalScrollLock();
    expect(modalScrollLockCount()).toBe(1);
    expect((globalThis.document.documentElement as FakeElement).style.overflow).toBe('hidden');
    release();
    expect(modalScrollLockCount()).toBe(0);
    expect((globalThis.document.documentElement as FakeElement).style.overflow).toBe('');
  });

  it('keeps the lock while nested modals are open (counted release)', () => {
    const releaseOuter = acquireModalScrollLock();
    const releaseInner = acquireModalScrollLock();
    expect(modalScrollLockCount()).toBe(2);
    releaseInner();
    expect(modalScrollLockCount()).toBe(1);
    expect((globalThis.document.documentElement as FakeElement).style.overflow).toBe('hidden');
    releaseOuter();
    expect((globalThis.document.documentElement as FakeElement).style.overflow).toBe('');
  });

  it('survives an extra release without going negative', () => {
    const release = acquireModalScrollLock();
    release();
    release();
    expect(modalScrollLockCount()).toBe(0);
    expect((globalThis.document.documentElement as FakeElement).style.overflow).toBe('');
  });
});
