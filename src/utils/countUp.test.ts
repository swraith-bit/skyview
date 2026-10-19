import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTween, easeOutCubic, prefersReducedMotion } from './countUp';

describe('countUp çekirdeği (F6.7)', () => {
  it('easeOutCubic uçlarda 0/1 ve aralıkta monoton', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBeCloseTo(1, 12);
    let previous = 0;
    for (let i = 1; i <= 10; i += 1) {
      const value = easeOutCubic(i / 10);
      expect(value).toBeGreaterThan(previous);
      expect(value).toBeLessThanOrEqual(1);
      previous = value;
    }
  });

  it('tween uçlarda from/to, ortada aralık içinde sayar', () => {
    const tween = createTween(10, 30, 1000);
    expect(tween.at(0)).toBe(10);
    expect(tween.at(1000)).toBeCloseTo(30, 12);
    const mid = tween.at(500);
    expect(mid).toBeGreaterThan(10);
    expect(mid).toBeLessThan(30);
    expect(tween.reached(999)).toBe(false);
    expect(tween.reached(1000)).toBe(true);
    expect(tween.reached(1400)).toBe(true);
  });

  it('negatif yön de doğru kayar', () => {
    const tween = createTween(80, 20, 400);
    expect(tween.at(0)).toBe(80);
    const mid = tween.at(200);
    expect(mid).toBeGreaterThan(20);
    expect(mid).toBeLessThan(80);
    expect(tween.at(400)).toBeCloseTo(20, 12);
  });

  it('sıfır/negatif süre ve sonlu olmayan hedef anında yapışır (snap)', () => {
    expect(createTween(5, 9, 0).at(100)).toBe(9);
    expect(createTween(5, 9, -10).at(100)).toBe(9);
    expect(createTween(5, Number.NaN, 300).at(0)).toBe(5);
    expect(createTween(5, Number.NaN, 300).reached(0)).toBe(true);
    expect(createTween(5, 9, Number.NaN).at(50)).toBe(9);
  });

  it('aynı from/to: reached her koşulda true', () => {
    const tween = createTween(7, 7, 500);
    expect(tween.at(0)).toBe(7);
    expect(tween.reached(0)).toBe(true);
  });

  it('prefersReducedMotion: window yoksa false, reduce matchMedia ise true', () => {
    // node ortam: window stub'lanmamış
    expect(prefersReducedMotion()).toBe(false);
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockReturnValue({ matches: true }),
    });
    expect(prefersReducedMotion()).toBe(true);
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});
