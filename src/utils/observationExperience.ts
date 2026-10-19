import { Body, Equator, Horizon, Illumination, MakeTime, Observer } from 'astronomy-engine';
import { DarknessWindow, HourlyData, LocationData } from '../types';

const altitudeOf = (body: Body, date: Date, location: LocationData): number => {
  const observer = new Observer(location.latitude, location.longitude, 0);
  const time = MakeTime(date);
  const eq = Equator(body, time, observer, true, true);
  return Horizon(time, observer, eq.ra, eq.dec, 'normal').altitude;
};

const cloudAt = (date: Date, hourly: HourlyData | null | undefined, fallback: number): number => {
  if (!hourly?.time.length || !hourly.cloudCover.length) return fallback;
  let closest = 0;
  let distance = Number.POSITIVE_INFINITY;
  hourly.time.forEach((value, index) => {
    const instant = typeof value === 'number' ? value * 1000 : new Date(value).getTime();
    const candidate = Math.abs(instant - date.getTime());
    if (candidate < distance) {
      distance = candidate;
      closest = index;
    }
  });
  return hourly.cloudCover[closest] ?? fallback;
};

export const calculateDarknessWindow = (
  now: Date,
  location: LocationData,
  hourly: HourlyData | null | undefined,
  fallbackCloudCover: number,
): DarknessWindow | null => {
  const stepMs = 15 * 60_000;
  const points = Array.from({ length: 121 }, (_, index) => new Date(now.getTime() + index * stepMs));
  const moonIllumination = Illumination(Body.Moon, now).phase_fraction;
  const eligible = points.map(time => {
    const sunAltitude = altitudeOf(Body.Sun, time, location);
    const moonAltitude = altitudeOf(Body.Moon, time, location);
    const clouds = cloudAt(time, hourly, fallbackCloudCover);
    return {
      time,
      clouds,
      moonBelow: moonAltitude <= 0,
      suitable: sunAltitude <= -18 && clouds <= 45 && (moonAltitude <= 0 || moonIllumination <= 0.3),
    };
  });

  let best: typeof eligible = [];
  let current: typeof eligible = [];
  eligible.forEach(point => {
    if (point.suitable) {
      current.push(point);
      if (current.length > best.length) best = [...current];
    } else {
      current = [];
    }
  });
  if (!best.length) return null;

  return {
    start: best[0]!.time,
    end: new Date(best.at(-1)!.time.getTime() + stepMs),
    durationMinutes: best.length * 15,
    averageCloudCover: Math.round(best.reduce((sum, point) => sum + point.clouds, 0) / best.length),
    moonIllumination,
    moonBelowHorizon: best.every(point => point.moonBelow),
  };
};
