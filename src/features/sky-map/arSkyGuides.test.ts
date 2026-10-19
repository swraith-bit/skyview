import { Body, Equator, Horizon, MakeTime, Observer } from 'astronomy-engine';
import { describe, expect, it } from 'vitest';
import { buildCelestialEquatorGuide, buildEclipticGuide, GuidePoint } from './arSkyGuides';

const DEG = Math.PI / 180;
const observer = new Observer(39.93, 32.85, 0); // Ankara
const time = MakeTime(new Date('2026-10-17T18:00:00Z'));

const angularDistanceDeg = (a: GuidePoint, b: GuidePoint): number => {
  const deltaAz = ((a.az - b.az + 540) % 360) - 180;
  const meanAltRad = ((a.alt + b.alt) / 2) * DEG;
  return Math.hypot(deltaAz * Math.cos(meanAltRad), a.alt - b.alt);
};

describe('sky guide rings (F2.1)', () => {
  it('ecliptic ring is closed, on the celestial sphere, and passes near the Sun', () => {
    const segments = buildEclipticGuide(time, observer);

    expect(segments).toHaveLength(60);
    segments.forEach(segment => {
      [segment.start, segment.end].forEach(point => {
        expect(point.az).toBeGreaterThanOrEqual(0);
        expect(point.az).toBeLessThan(360);
        expect(point.alt).toBeGreaterThanOrEqual(-90);
        expect(point.alt).toBeLessThanOrEqual(90);
        expect(Number.isFinite(point.az)).toBe(true);
        expect(Number.isFinite(point.alt)).toBe(true);
      });
    });

    // Ring continuity: each segment ends exactly where the next one starts.
    segments.forEach((segment, index) => {
      const next = segments[(index + 1) % segments.length]!; // noUnchecked: modulo indeksi daima gecerli
      expect(segment.end.az).toBeCloseTo(next.start.az, 5);
      expect(segment.end.alt).toBeCloseTo(next.start.alt, 5);
    });

    // The Sun rides the ecliptic; the ring must pass within 1 deg of it.
    const sunEquatorial = Equator(Body.Sun, time, observer, true, true);
    const sunHorizon = Horizon(time, observer, sunEquatorial.ra, sunEquatorial.dec, 'normal');
    const sunPoint: GuidePoint = { az: sunHorizon.azimuth, alt: sunHorizon.altitude };
    let minDistance = Infinity;
    segments.forEach(segment => {
      minDistance = Math.min(
        minDistance,
        angularDistanceDeg(segment.start, sunPoint),
        angularDistanceDeg(segment.end, sunPoint),
      );
    });
    expect(minDistance).toBeLessThan(1);
  });

  it('celestial equator ring spans 36 segments and peaks at 90 minus the latitude', () => {
    const segments = buildCelestialEquatorGuide(time, observer);

    expect(segments).toHaveLength(36);
    segments.forEach((segment, index) => {
      const next = segments[(index + 1) % segments.length]!; // noUnchecked: modulo indeksi daima gecerli
      expect(segment.end.az).toBeCloseTo(next.start.az, 5);
      expect(segment.end.alt).toBeCloseTo(next.start.alt, 5);
    });

    const altitude = observer.latitude;
    const allAlts = segments.flatMap(segment => [segment.start.alt, segment.end.alt]);
    const peak = Math.max(...allAlts);
    const trough = Math.min(...allAlts);
    // The true extrema are the meridian crossings (alt = +/- (90 - lat)). 10 deg
    // RA samples may miss the crossing by up to ~half a degree, and Horizon's
    // atmospheric refraction also nudges altitudes upward, so allow ~0.5 deg.
    const halfDegree = 0.5;
    expect(Math.abs(peak - (90 - altitude))).toBeLessThan(halfDegree);
    expect(Math.abs(trough + (90 - altitude))).toBeLessThan(halfDegree);

  });
});
