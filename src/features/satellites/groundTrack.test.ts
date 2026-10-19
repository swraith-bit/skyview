import { describe, expect, it } from 'vitest';
import {
  DEG_TO_RAD,
  ISS_INCLINATION_DEG,
  argumentOfLatitudeRad,
  groundTrackLatitudeRad,
  groundTrackNodeRad,
  normalizeAngleRad,
} from './groundTrack';

const INCLINATION_RAD = ISS_INCLINATION_DEG * DEG_TO_RAD;

// Golden pairs derived independently from the circular-orbit ground-track relation
// φ = asin(sin i · sin u), λ-offset d = atan2(sin u · cos i, cos u) ⇒ tan u = tan d / cos i
// (i = 51.64°: sin i ≈ 0.784079, cos i ≈ 0.620602). Hand-computed at ±0.02° precision.
const GOLDEN_TRACK_LATS: Array<[dLngDeg: number, expectedLatDeg: number]> = [
  [0, 0],
  [30, 32.28],
  [45, 41.78],
  [60, 47.58],
  [90, 51.64],
  [120, 47.57],
  [-30, -32.28],
  [-90, -51.64],
];

describe('F4.3 ISS ground-track relations', () => {
  it('normalizes angles into (-π, π] including the half-turn edge', () => {
    expect(normalizeAngleRad(0)).toBe(0);
    expect(normalizeAngleRad(Math.PI / 2)).toBeCloseTo(Math.PI / 2, 12);
    expect(normalizeAngleRad((3 * Math.PI) / 2)).toBeCloseTo(-Math.PI / 2, 12);
    // JS rounds -0.5 toward zero, so -π must not be emitted from the boundary:
    expect(normalizeAngleRad(-Math.PI)).toBe(Math.PI);
  });

  it('reaches latitude exactly at ±90° longitude offset', () => {
    expect(argumentOfLatitudeRad(Math.PI / 2, INCLINATION_RAD)).toBeCloseTo(Math.PI / 2, 10);
    expect(argumentOfLatitudeRad(-(3 * Math.PI) / 2, INCLINATION_RAD)).toBeCloseTo(Math.PI / 2, 10);
  });

  it('follows the golden curve for the ISS inclination', () => {
    for (const [dLngDeg, expected] of GOLDEN_TRACK_LATS) {
      const latDeg = groundTrackLatitudeRad(dLngDeg * DEG_TO_RAD, INCLINATION_RAD) / DEG_TO_RAD;
      expect(latDeg).toBeCloseTo(expected, 1); // ±0.05° on a by-hand reference
    }
  });

  it('keeps the curve within ±0.5° of the parametric reference (audit tolerance)', () => {
    // Independent parametric check: sample u ∈ (0, 2π), then evaluate φ(λ(u) − Ω0).
    const inclinationRad = INCLINATION_RAD;
    for (let step = 3; step <= 177; step += 3) {
      const u = (step / 180) * Math.PI;
      const latU = Math.asin(Math.sin(inclinationRad) * Math.sin(u)); // parametric reference
      const dLngU = Math.atan2(Math.sin(u) * Math.cos(inclinationRad), Math.cos(u));
      const latFn = groundTrackLatitudeRad(dLngU, inclinationRad);
      expect(latFn).toBeCloseTo(latU, 2); // ±0.5° = 0.0087 rad, checked at 0.01 rad precision
      expect(Math.abs(latFn - latU)).toBeLessThan(0.5 * DEG_TO_RAD);
    }
  });

  it('anchors the drawn sinusoid on both orbit branches', () => {
    const cases: Array<{ lat: number; lng: number; movingNorth: boolean }> = [
      { lat: 20, lng: 100, movingNorth: true },
      { lat: 20, lng: 100, movingNorth: false },
      { lat: -45, lng: -170, movingNorth: true },
      { lat: -45, lng: -170, movingNorth: false },
      { lat: 51.64, lng: 37, movingNorth: false },
      { lat: -58, lng: 7, movingNorth: true }, // overshoot clamps to the peak
    ];
    for (const point of cases) {
      const nodeRad = groundTrackNodeRad(point, point.movingNorth, INCLINATION_RAD);
      const lngRad = point.lng * DEG_TO_RAD;
      const latDeg = groundTrackLatitudeRad(lngRad - nodeRad, INCLINATION_RAD) / DEG_TO_RAD;
      const expectedLat = Math.max(-ISS_INCLINATION_DEG, Math.min(ISS_INCLINATION_DEG, point.lat));
      expect(latDeg).toBeCloseTo(expectedLat, 2);
    }
  });

  it('places the next peak exactly 90° of longitude past the node', () => {
    // Orbit quarter: node → north pole crossing of the track happens 90° later.
    const peakLatRad = groundTrackLatitudeRad(Math.PI / 2, INCLINATION_RAD) / DEG_TO_RAD;
    expect(peakLatRad).toBeCloseTo(ISS_INCLINATION_DEG, 6);
  });
});
