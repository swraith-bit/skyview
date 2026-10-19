import { describe, expect, it } from 'vitest';
import {
  calculateAngularDistance,
  calculateEffectiveHorizontalFov,
  computeCameraTrueHeadingDeg,
  convertTrueToTrackingAzimuth,
  DEFAULT_HORIZONTAL_FOV,
} from './arCameraModel';

const cameraModel = {
  available: true,
  horizontalFov: 70,
  verticalFov: 55,
  sensorWidth: 4000,
  sensorHeight: 3000,
};

describe('AR camera projection model', () => {
  it('falls back when native camera metadata is unavailable', () => {
    expect(calculateEffectiveHorizontalFov(null, 1280, 720, 1080, 1920)).toBe(DEFAULT_HORIZONTAL_FOV);
  });

  it('accounts for portrait object-fit cover cropping', () => {
    const landscapeFov = calculateEffectiveHorizontalFov(cameraModel, 1280, 720, 1920, 1080);
    const portraitFov = calculateEffectiveHorizontalFov(cameraModel, 1280, 720, 1080, 1920);
    expect(landscapeFov).toBeCloseTo(70, 1);
    expect(portraitFov).toBeLessThan(landscapeFov);
    expect(portraitFov).toBeGreaterThanOrEqual(20);
  });

  it('converts true-north azimuth into the magnetic tracking frame', () => {
    expect(convertTrueToTrackingAzimuth(0, 10, 0)).toBe(350);
    expect(convertTrueToTrackingAzimuth(5, -5, 10)).toBe(0);
  });

  it('computes shortest angular separation across 0/360 degree boundary', () => {
    expect(calculateAngularDistance(355, 5)).toBe(10);
    expect(calculateAngularDistance(5, 355)).toBe(10);
    expect(calculateAngularDistance(180, 0)).toBe(180);
    expect(calculateAngularDistance(90, 90)).toBe(0);
  });

  // F6.4: HUD altın testleri — merkez-eksen true azimutu, radar hedefleme
  // formülünün ters-dönüşümü (tracking → true + declination + offset) ile birebir.
  describe('computeCameraTrueHeadingDeg', () => {
    it('derives true heading from the fused native matrix', () => {
      // atan2(-r13, -r23) = atan2(0.5, 0.8660254) = 30°; tracking çerçevesi
      // (true − declination − offset): 30 + 4.5 + 2.5 → 37.
      const matrix = new Array(9).fill(0) as [number, number, number, number, number, number, number, number, number];
      matrix[2] = -0.5;
      matrix[5] = -0.8660254;
      expect(computeCameraTrueHeadingDeg(matrix, 0, 4.5, 2.5)).toBeCloseTo(37, 6);
    });

    it('wraps at the 0/360 boundary and aligns with convertTrueToTrackingAzimuth', () => {
      const matrix = new Array(9).fill(0) as [number, number, number, number, number, number, number, number, number];
      // r13 = -1 → atan2(1, 0) = 90°; declination 10 → true 100.
      matrix[2] = -1;
      const heading = computeCameraTrueHeadingDeg(matrix, 0, 10, 0);
      expect(heading).toBeCloseTo(100, 6);
      // Altın çift yönlü zalil: aynı çerçeveye geri çevrilirse başlığa denk düşer.
      expect(convertTrueToTrackingAzimuth(heading, 10, 0)).toBe(
        (90 + 360) % 360,
      );
    });

    it('falls back to the smoothed yaw when the forward axis is vertical', () => {
      const matrix = new Array(9).fill(0) as [number, number, number, number, number, number, number, number, number];
      // r13/r23 = 0 → telefon dikey bakıyor; azimut yaw + offset ile çözülür.
      expect(computeCameraTrueHeadingDeg(matrix, 405, 0, 0)).toBe(45);
    });

    it('falls back when no native matrix exists (web sensor path)', () => {
      expect(computeCameraTrueHeadingDeg(null, -10, 0, 0)).toBe(350);
      expect(computeCameraTrueHeadingDeg(null, 0, 0, 7)).toBe(7);
    });
  });
});
