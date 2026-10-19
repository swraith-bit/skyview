import { EquipmentKind, HourlyData, MoonPhaseInfo, TonightTarget } from '../types';
import {
  Body,
  MakeTime,
  Observer,
  Horizon,
  Equator,
  Constellation,
  Illumination,
  MoonPhase,
  SearchAltitude,
  SearchHourAngle,
  SearchRiseSet,
} from 'astronomy-engine';
import { LangCode, t } from '../i18n';
import { getLocalDateParts, makeInstantForTimeZone } from './dateTime';
import { canonicalCompassCode } from './compass';

const SYNODIC_MONTH_DAYS = 29.530588853;

const getMoonPhaseType = (phaseAngle: number): string => {
  if (phaseAngle < 16.8 || phaseAngle >= 343.2) return 'new-moon';
  if (phaseAngle < 73.1) return 'waxing-crescent';
  if (phaseAngle < 106.9) return 'first-quarter';
  if (phaseAngle < 163.2) return 'waxing-gibbous';
  if (phaseAngle < 196.8) return 'full-moon';
  if (phaseAngle < 253.1) return 'waning-gibbous';
  if (phaseAngle < 286.9) return 'last-quarter';
  return 'waning-crescent';
};

/**
 * Calculates moon phase information for a given date.
 * Based on highly reliable astronomical formulas.
 */
export function getMoonPhase(date: Date, lang?: LangCode): MoonPhaseInfo {
  const phaseAngle = MoonPhase(date);
  const illumination = Illumination(Body.Moon, date);
  const age = (phaseAngle / 360) * SYNODIC_MONTH_DAYS;
  const isWaxing = phaseAngle < 180;
  const fraction = Math.max(0, Math.min(1, illumination.phase_fraction));
  const phaseType = getMoonPhaseType(phaseAngle);

  const phaseName = lang ? t(`moon.phases.${phaseType}`, lang) : {
    'new-moon': 'Yeni Ay',
    'waxing-crescent': 'Büyüyen Hilal',
    'first-quarter': 'İlk Dördün',
    'waxing-gibbous': 'Büyüyen Şişkin Ay',
    'full-moon': 'Dolunay',
    'waning-gibbous': 'Küçülen Şişkin Ay',
    'last-quarter': 'Son Dördün',
    'waning-crescent': 'Küçülen Hilal'
  }[phaseType] || 'Yeni Ay';

  return {
    date,
    age,
    phaseName,
    phaseType,
    fraction,
    isWaxing
  };
}

export function getMoonPhaseForLocalDate(
  date: Date,
  lang?: LangCode,
  timeZone?: string,
  hour = 21,
): MoonPhaseInfo {
  const { year, month, day } = getLocalDateParts(date, timeZone);
  return getMoonPhase(makeInstantForTimeZone(year, month, day, hour, timeZone), lang);
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  moonPhase: MoonPhaseInfo;
}

export interface VisiblePlanet {
  name: string;
  constellation: string;
  direction: string;
  altitude: number;
}

export function getVisiblePlanets(date: Date, lat: number, lon: number): VisiblePlanet[] {
  const observer = new Observer(lat, lon, 0);
  const time = MakeTime(date);
  const sunEq = Equator(Body.Sun, time, observer, true, true);
  const sunHor = Horizon(time, observer, sunEq.ra, sunEq.dec, 'normal');

  // A planet is not practically observable while the Sun is above civil twilight.
  if (sunHor.altitude > -6) return [];
  
  const ObjectToBody: Record<string, Body> = {
    'Mercury': Body.Mercury,
    'Venus': Body.Venus,
    'Mars': Body.Mars,
    'Jupiter': Body.Jupiter,
    'Saturn': Body.Saturn
  };

  const planetsToCheck = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
  const result: VisiblePlanet[] = [];

  for (const pStr of planetsToCheck) {
      const p = ObjectToBody[pStr];
      if (!p) continue;
      const eq = Equator(p, time, observer, true, true);
      const hor = Horizon(time, observer, eq.ra, eq.dec, 'normal');
      // If altitude > 5 degrees, it's reasonably visible
      if (hor.altitude > 5) {
          const constell = Constellation(eq.ra, eq.dec);
          
          result.push({
              name: pStr,
              constellation: constell.name,
              direction: canonicalCompassCode(hor.azimuth),
              altitude: hor.altitude
          });
      }
  }

  // Sort highest altitude first
  result.sort((a, b) => b.altitude - a.altitude);

  return result;
}

export function getVisiblePlanetsTonight(date: Date, lat: number, lon: number): VisiblePlanet[] {
  const start = new Date(date);
  start.setMinutes(0, 0, 0);
  const points = Array.from({ length: 37 }, (_, index) =>
    new Date(start.getTime() + index * 60 * 60 * 1000));
  const bestByPlanet = new Map<string, VisiblePlanet>();

  points.forEach(point => {
    getVisiblePlanets(point, lat, lon).forEach(planet => {
      const existing = bestByPlanet.get(planet.name);
      if (!existing || planet.altitude > existing.altitude) {
        bestByPlanet.set(planet.name, planet);
      }
    });
  });

  return Array.from(bestByPlanet.values()).sort((a, b) => b.altitude - a.altitude);
}

const TRACKED_BODIES: Array<{
  id: string;
  body: Body;
  equipment: EquipmentKind[];
}> = [
  { id: 'moon', body: Body.Moon, equipment: ['naked-eye', 'binoculars', 'telescope', 'camera'] },
  { id: 'mercury', body: Body.Mercury, equipment: ['naked-eye', 'binoculars', 'telescope'] },
  { id: 'venus', body: Body.Venus, equipment: ['naked-eye', 'binoculars', 'camera'] },
  { id: 'mars', body: Body.Mars, equipment: ['naked-eye', 'telescope', 'camera'] },
  { id: 'jupiter', body: Body.Jupiter, equipment: ['naked-eye', 'binoculars', 'telescope', 'camera'] },
  { id: 'saturn', body: Body.Saturn, equipment: ['naked-eye', 'telescope', 'camera'] },
  { id: 'uranus', body: Body.Uranus, equipment: ['binoculars', 'telescope', 'camera'] },
  { id: 'neptune', body: Body.Neptune, equipment: ['telescope', 'camera'] },
];

const getBodyHorizonWithObserver = (
  body: Body,
  time: ReturnType<typeof MakeTime>,
  observer: Observer,
) => {
  const eq = Equator(body, time, observer, true, true);
  return Horizon(time, observer, eq.ra, eq.dec, 'normal');
};

const getPracticalEquipment = (
  id: string,
  baseEquipment: EquipmentKind[],
  altitude: number,
  sunAltitude: number,
): EquipmentKind[] => baseEquipment.filter(kind => {
  if (kind === 'naked-eye') {
    if (id === 'moon') return altitude >= 5;
    if (id === 'mercury') return altitude >= 12 && sunAltitude <= -10;
    return altitude >= 10 && sunAltitude <= -8;
  }
  if (kind === 'binoculars') return altitude >= 8 && sunAltitude <= -6;
  if (kind === 'telescope') return altitude >= 12 && sunAltitude <= -6;
  if (kind === 'camera') return altitude >= 12 && sunAltitude <= -8;
  return false;
});

export function getTonightTargets(
  date: Date,
  lat: number,
  lon: number,
  weather: number | HourlyData = 0,
): TonightTarget[] {
  const observer = new Observer(lat, lon, 0);
  const start = new Date(date);
  start.setMinutes(0, 0, 0);
  const points = Array.from({ length: 25 }, (_, index) =>
    new Date(start.getTime() + index * 60 * 60 * 1000));

  // Bound to the first contiguous astronomical dark window (Sun altitude <= -6°)
  // so opening the app late at night does not spill over into the next night's window.
  const darkPoints: Array<{
    time: Date;
    astroTime: ReturnType<typeof MakeTime>;
    sunAltitude: number;
  }> = [];
  let inFirstDarkWindow = false;
  for (const time of points) {
    const astroTime = MakeTime(time);
    const sunAltitude = getBodyHorizonWithObserver(Body.Sun, astroTime, observer).altitude;
    if (sunAltitude <= -6) {
      inFirstDarkWindow = true;
      darkPoints.push({ time, astroTime, sunAltitude });
    } else if (inFirstDarkWindow) {
      break;
    }
  }
  if (darkPoints.length === 0) return [];

  const cloudAt = (time: Date): number => {
    if (typeof weather === 'number') return weather;
    if (!weather.time.length || !weather.cloudCover.length) return 50;
    const targetMs = time.getTime();
    let closestIndex = 0;
    let closestDistance = Infinity;
    weather.time.forEach((value, index) => {
      const pointDate = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
      const distance = Math.abs(pointDate.getTime() - targetMs);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    return weather.cloudCover[closestIndex] ?? 50;
  };

  return TRACKED_BODIES.map(target => {
    const sampledPoints = darkPoints.map(point => {
      const horizon = getBodyHorizonWithObserver(target.body, point.astroTime, observer);
      return {
        time: point.time,
        altitude: horizon.altitude,
        azimuth: horizon.azimuth,
        sunAltitude: point.sunAltitude,
      };
    });
    const best = sampledPoints.reduce((highest, point) => {
      const pointScore = point.altitude * 1.15 + (100 - cloudAt(point.time)) * 0.35;
      const highestScore = highest.altitude * 1.15 + (100 - cloudAt(highest.time)) * 0.35;
      return pointScore > highestScore ? point : highest;
    });
    const practicalEquipment = getPracticalEquipment(
      target.id,
      target.equipment,
      best.altitude,
      best.sunAltitude,
    );
    const score = Math.round(Math.max(0, Math.min(100,
      best.altitude * 1.15 + (100 - cloudAt(best.time)) * 0.35)));
    const direction = canonicalCompassCode(best.azimuth);

    return {
      id: target.id,
      equipment: practicalEquipment,
      bestTime: best.time,
      altitude: best.altitude,
      direction,
      score,
      visibility: (best.altitude >= 45 ? 'excellent' : best.altitude >= 15 ? 'good' : 'low') as TonightTarget['visibility'],
      altitudePoints: sampledPoints.map(({ time, altitude }) => ({ time, altitude })),
    };
  })
    .filter(target => target.altitude > 5 && target.equipment.length > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Generates 42 days (6-week grid) for a full calendar monthly grid.
 * Starts from Monday.
 */
export function generateCalendarMonth(
  year: number,
  monthIndex: number,
  lang?: LangCode,
  timeZone?: string,
): CalendarDay[] {
  const days: CalendarDay[] = [];
  
  // First day of current month
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday ...
  
  // Calculate padding to reach previous Monday
  const prevMonthOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(firstDayOfMonth.getDate() - prevMonthOffset);
  
  // Fill 42 days grid (6 weeks)
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
      days.push({
        date: currentDate,
        isCurrentMonth: currentDate.getMonth() === monthIndex,
        moonPhase: getMoonPhaseForLocalDate(currentDate, lang, timeZone)
      });
  }
  
  return days;
}

/** Evening Sun events, named after the SunCalc fields the AR photo guide was built on. */
export interface EveningSunTimes {
  goldenHour: Date | null;   // Sun descends through +6°
  sunsetStart: Date | null;  // lower limb touches the horizon (-0.3°)
  sunset: Date | null;       // apparent sunset, refraction-corrected
  dusk: Date | null;         // civil dusk (-6°)
  nauticalDusk: Date | null; // nautical dusk (-12°)
  night: Date | null;        // astronomical night begins (-18°)
}

/**
 * Evening Sun events for the location's local calendar date. Searches start at
 * local solar noon so late twilight that crosses midnight still belongs to the
 * same evening. A field is null when the Sun never reaches that altitude
 * (polar day/night, or near midsummer at high latitudes).
 */
export function getEveningSunTimes(
  date: Date,
  lat: number,
  lon: number,
  timeZone?: string,
): EveningSunTimes {
  const observer = new Observer(lat, lon, 0);
  const { year, month, day } = getLocalDateParts(date, timeZone);
  const localMidnight = makeInstantForTimeZone(year, month, day, 0, timeZone);
  const solarNoon = SearchHourAngle(Body.Sun, observer, 0, localMidnight).time;
  const descendsThrough = (altitude: number): Date | null =>
    SearchAltitude(Body.Sun, observer, -1, solarNoon, 1, altitude)?.date ?? null;

  return {
    goldenHour: descendsThrough(6),
    sunsetStart: descendsThrough(-0.3),
    sunset: SearchRiseSet(Body.Sun, observer, -1, solarNoon, 1)?.date ?? null,
    dusk: descendsThrough(-6),
    nauticalDusk: descendsThrough(-12),
    night: descendsThrough(-18),
  };
}
