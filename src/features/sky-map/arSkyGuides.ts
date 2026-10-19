import {
  AstroTime,
  EquatorFromVector,
  Horizon,
  Observer,
  RotateVector,
  Rotation_ECT_EQD,
  Vector,
} from 'astronomy-engine';

// F2.1: az/alt line sets for the ecliptic (the Sun's annual path) and the
// celestial equator, used by the AR scene-controls toggles. Every ring is
// generated as a closed loop of consecutive point pairs so both the canvas
// fallback and the GPU layer can draw projected segments uniformly.

export interface GuidePoint {
  az: number;
  alt: number;
}

export interface GuideSegment {
  start: GuidePoint;
  end: GuidePoint;
}

const ECLIPTIC_SAMPLES = 60; // 6 degrees per segment
const EQUATOR_SAMPLES = 36; // 10 degrees (2h RA) per segment
const DEG2RAD = Math.PI / 180;

const ringToSegments = (points: readonly GuidePoint[]): GuideSegment[] =>
  // noUnchecked: modulo indeksi her zaman 0..length-1 araliginda kaldigi icin eleman garanti
  points.map((point, index) => ({ start: point, end: points[(index + 1) % points.length]! }));

export const buildEclipticGuide = (time: AstroTime, observer: Observer): GuideSegment[] => {
  // True ecliptic-of-date frame: sample the circle lambda in [0..360) at zero
  // ecliptic latitude, rotate J2000-ecliptic -> equator-of-date, then project.
  const rotation = Rotation_ECT_EQD(time);
  const points: GuidePoint[] = [];
  for (let index = 0; index < ECLIPTIC_SAMPLES; index += 1) {
    const lambda = (index * 360 / ECLIPTIC_SAMPLES) * DEG2RAD;
    const equatorial = EquatorFromVector(
      RotateVector(rotation, new Vector(Math.cos(lambda), Math.sin(lambda), 0, time)),
    );
    const horizon = Horizon(time, observer, equatorial.ra, equatorial.dec, 'normal');
    points.push({ az: horizon.azimuth, alt: horizon.altitude });
  }
  return ringToSegments(points);
};

export const buildCelestialEquatorGuide = (time: AstroTime, observer: Observer): GuideSegment[] => {
  // The celestial equator is dec = 0; walking RA around the full day projects
  // the same great circle without needing a frame rotation.
  const points: GuidePoint[] = [];
  for (let index = 0; index < EQUATOR_SAMPLES; index += 1) {
    const raHours = index * 24 / EQUATOR_SAMPLES;
    const horizon = Horizon(time, observer, raHours, 0, 'normal');
    points.push({ az: horizon.azimuth, alt: horizon.altitude });
  }
  return ringToSegments(points);
};
