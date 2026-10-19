import { describe, expect, it } from 'vitest';
import { getTrackingQuality, orientationAnglesFromMatrix, snapCoordinatesForTracking } from './useCompass';

describe('AR tracking quality', () => {
  it('requires an active sensor before reporting usable tracking', () => {
    expect(getTrackingQuality('denied', true, true)).toBe('poor');
    expect(getTrackingQuality('not-supported', false, false)).toBe('poor');
  });

  it('distinguishes relative and calibrated headings', () => {
    expect(getTrackingQuality('active', false, false)).toBe('fair');
    expect(getTrackingQuality('active', true, false)).toBe('good');
    expect(getTrackingQuality('active', false, true)).toBe('good');
  });

  it('uses native sensor accuracy when it is available', () => {
    expect(getTrackingQuality('active', true, false, 'high')).toBe('good');
    expect(getTrackingQuality('active', true, false, 'low')).toBe('fair');
    expect(getTrackingQuality('active', true, true, 'unreliable')).toBe('poor');
  });

  it('derives stable orientation angles from an identity matrix', () => {
    expect(orientationAnglesFromMatrix([1, 0, 0, 0, 1, 0, 0, 0, 1])).toEqual({
      alpha: 0,
      beta: 0,
      gamma: 0,
    });
  });

  it('extracts positive pitch (beta) and ENU azimuth (alpha) without sign inversion', () => {
    // 90° azimuth (East: -sin(90°)=-1 at matrix[1], cos(90°)=0 at matrix[4]) and +30° pitch (sin(30°)=0.5 at matrix[7])
    const angles = orientationAnglesFromMatrix([0, -Math.cos(Math.PI / 6), 0, 1, 0, 0, 0, 0.5, Math.cos(Math.PI / 6)]);
    expect(angles.alpha).toBeCloseTo(90, 5);
    expect(angles.beta).toBeCloseTo(30, 5);
  });
});

describe('snapped tracking coordinates (F2.7)', () => {
  it('rounds to ~111 m so GPS noise cannot restart the native tracker on every fix', () => {
    expect(snapCoordinatesForTracking(41.01510, 28.97703)).toEqual({ latitude: 41.015, longitude: 28.977 });
  });

  it('produces the same snapped pair inside the rounding box', () => {
    expect(snapCoordinatesForTracking(41.003451, 12.496422)).toEqual(snapCoordinatesForTracking(41.003449, 12.496402));
  });

  it('maps non-finite coordinates to a safe origin instead of NaN', () => {
    expect(snapCoordinatesForTracking(Number.NaN, Infinity)).toEqual({ latitude: 0, longitude: 0 });
  });
});
