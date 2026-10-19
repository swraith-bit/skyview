import { beforeEach, describe, expect, it } from 'vitest';
import { consumeBackButtonModal, modalBackStackSize, registerModalForBack } from './backButtonRegistry';

const closed: string[] = [];
const tracker = (name: string) => () => { closed.push(name); };

describe('back button modal registry (F5.3)', () => {
  beforeEach(() => {
    // Yığın modül-kapsamlı: her test sıfır yığınla başlar (aşırı-ref ile temizlenemezse test başarısız sinyali).
    while (consumeBackButtonModal()) { /* drain */ }
    closed.length = 0;
  });

  it('returns false when no modal is registered', () => {
    expect(consumeBackButtonModal()).toBe(false);
    expect(modalBackStackSize()).toBe(0);
  });

  it('closes the topmost modal first (LIFO hardware back)', () => {
    const releaseDetail = registerModalForBack(tracker('detail'));
    try {
      const releaseMap = registerModalForBack(tracker('map'));
      expect(modalBackStackSize()).toBe(2);
      expect(consumeBackButtonModal()).toBe(true);
      expect(closed).toEqual(['map']);
      expect(consumeBackButtonModal()).toBe(true);
      expect(closed).toEqual(['map', 'detail']);
      expect(consumeBackButtonModal()).toBe(false);
      releaseMap();
    } finally {
      releaseDetail();
    }
    expect(modalBackStackSize()).toBe(0);
  });

  it('unregister removes exactly its own registration', () => {
    registerModalForBack(tracker('first'));
    registerModalForBack(tracker('second'));
    const releaseThird = registerModalForBack(tracker('third'));
    releaseThird();
    expect(modalBackStackSize()).toBe(2);
    expect(consumeBackButtonModal()).toBe(true);
    expect(closed).toEqual(['second']);
  });

  it('re-registering after unregister pushes a fresh registration', () => {
    const close = tracker('reusable');
    const releaseA = registerModalForBack(close);
    releaseA();
    expect(modalBackStackSize()).toBe(0);
    const releaseB = registerModalForBack(close);
    expect(modalBackStackSize()).toBe(1);
    expect(consumeBackButtonModal()).toBe(true);
    expect(closed).toEqual(['reusable']);
    releaseB();
    expect(modalBackStackSize()).toBe(0);
  });
});
