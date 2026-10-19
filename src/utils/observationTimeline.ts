import { Body, Equator, Horizon, Illumination, MakeTime, Observer } from 'astronomy-engine';
import { HourlyData, SkyTimelinePoint, TonightTarget } from '../types';

const clamp = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, value));

const altitude = (body: Body, time: Date, latitude: number, longitude: number): number => {
  const observer = new Observer(latitude, longitude, 0);
  const instant = MakeTime(time);
  const equator = Equator(body, instant, observer, true, true);
  return Horizon(instant, observer, equator.ra, equator.dec, 'normal').altitude;
};

const closestCloud = (time: Date, hourly: HourlyData | null, fallback: number): number => {
  if (!hourly?.time.length || !hourly.cloudCover.length) return fallback;
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  hourly.time.forEach((value, index) => {
    const milliseconds = typeof value === 'number' ? value * 1000 : new Date(value).getTime();
    const distance = Math.abs(milliseconds - time.getTime());
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return clamp(hourly.cloudCover[bestIndex] ?? fallback);
};

const targetAltitudeAt = (target: TonightTarget, time: Date): number => {
  if (!target.altitudePoints.length) return 0;
  return target.altitudePoints.reduce((closest, point) => (
    Math.abs(point.time.getTime() - time.getTime()) < Math.abs(closest.time.getTime() - time.getTime()) ? point : closest
  )).altitude;
};

export const buildSkyTimeline = (
  now: Date,
  latitude: number,
  longitude: number,
  hourly: HourlyData | null,
  fallbackCloudCover: number,
  targets: TonightTarget[],
  hours = 12,
): SkyTimelinePoint[] => {
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  return Array.from({ length: hours }, (_, index) => {
    const time = new Date(start.getTime() + index * 60 * 60_000);
    const cloudCover = closestCloud(time, hourly, fallbackCloudCover);
    const sunAltitude = altitude(Body.Sun, time, latitude, longitude);
    const moonAltitude = altitude(Body.Moon, time, latitude, longitude);
    const moonIllumination = clamp(Illumination(Body.Moon, time).phase_fraction * 100);
    const targetCandidates = targets.map(target => ({ id: target.id, altitude: targetAltitudeAt(target, time) }));
    const bestTarget = targetCandidates.sort((a, b) => b.altitude - a.altitude)[0];
    const targetQuality = clamp(((bestTarget?.altitude ?? 0) / 60) * 100);
    const moonPenalty = moonAltitude > 0 ? moonIllumination * Math.min(1, moonAltitude / 30) : 0;
    const darknessQuality = sunAltitude <= -18 ? 100 : sunAltitude <= -12 ? 78 : sunAltitude <= -6 ? 52 : 0;
    const score = Math.round(clamp(
      darknessQuality * 0.28
      + (100 - cloudCover) * 0.37
      + targetQuality * 0.27
      + (100 - moonPenalty) * 0.08,
    ));
    const bestTargetAltitude = bestTarget?.altitude ?? 0;
    return {
      time,
      score: sunAltitude > -6 ? Math.min(score, 25) : score,
      cloudCover,
      sunAltitude,
      moonAltitude,
      moonIllumination,
      bestTargetId: bestTarget && bestTargetAltitude > 5 ? bestTarget.id : null,
      bestTargetAltitude,
    };
  });
};
