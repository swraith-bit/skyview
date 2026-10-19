// F3.5: worker-safe raw astronomy-event math. This module deliberately imports
// no i18n catalogs and touches no DOM so the shared astronomy worker can run
// the heavy three-year eclipse search and the 60-day planet sweep off the main
// thread. events.ts formats the raw results into localized AstroEvents on the
// main thread (string formatting of a handful of rows is cheap).
import {
  Body,
  Equator,
  Horizon,
  NextGlobalSolarEclipse,
  NextLunarEclipse,
  Observer,
  SearchGlobalSolarEclipse,
  SearchLunarEclipse,
} from 'astronomy-engine';
import { LocationData } from '../types';
import {
  getDateKeyInTimeZone,
  getLocalDateParts,
  makeInstantForTimeZone,
} from './dateTime';

export interface RawEclipseEvent {
  dateMs: number;
  kind: 'solar' | 'lunar';
  eclipseKind: string;
  obscuration?: number;
  latitude?: number;
  longitude?: number;
}

export interface RawPlanetApproach {
  dateMs: number;
  body: string;
  separation: number;
}

export interface RawAstroEventSearch {
  eclipses: RawEclipseEvent[];
  approaches: RawPlanetApproach[];
}

export const DEFAULT_OBSERVER_LOCATION: LocationData = {
  name: 'Istanbul',
  latitude: 41.0082,
  longitude: 28.9784,
  timezone: 'Europe/Istanbul'
};

export const computeEclipseEventsRaw = (fromDate: Date, timeZone?: string): RawEclipseEvent[] => {
  const currentYear = getLocalDateParts(fromDate, timeZone).year;
  const start = makeInstantForTimeZone(currentYear, 0, 1, 0, timeZone);
  const end = makeInstantForTimeZone(currentYear + 3, 0, 1, 0, timeZone);
  const events: RawEclipseEvent[] = [];

  let solar = SearchGlobalSolarEclipse(start);
  while (solar.peak.date < end) {
    events.push({
      dateMs: solar.peak.date.getTime(),
      kind: 'solar',
      eclipseKind: solar.kind,
      latitude: solar.latitude,
      longitude: solar.longitude,
      obscuration: solar.obscuration
    });
    solar = NextGlobalSolarEclipse(solar.peak);
  }

  let lunar = SearchLunarEclipse(start);
  while (lunar.peak.date < end) {
    events.push({
      dateMs: lunar.peak.date.getTime(),
      kind: 'lunar',
      eclipseKind: lunar.kind,
      obscuration: lunar.obscuration
    });
    lunar = NextLunarEclipse(lunar.peak);
  }

  return events;
};

export const planetsForCloseApproach = [
  { body: Body.Mercury, threshold: 4 },
  { body: Body.Venus, threshold: 6 },
  { body: Body.Mars, threshold: 6 },
  { body: Body.Jupiter, threshold: 6 },
  { body: Body.Saturn, threshold: 6 }
] as const;

const angularSeparation = (raHoursA: number, decDegA: number, raHoursB: number, decDegB: number): number => {
  const toRad = Math.PI / 180;
  const raA = raHoursA * 15 * toRad;
  const raB = raHoursB * 15 * toRad;
  const decA = decDegA * toRad;
  const decB = decDegB * toRad;
  const cosValue = Math.sin(decA) * Math.sin(decB) +
    Math.cos(decA) * Math.cos(decB) * Math.cos(raA - raB);
  return Math.acos(Math.max(-1, Math.min(1, cosValue))) / toRad;
};

export const computePlanetCloseApproachesRaw = (
  fromDate: Date,
  latitude: number,
  longitude: number,
  timeZone?: string,
): RawPlanetApproach[] => {
  const observer = new Observer(latitude, longitude, 0);
  const startParts = getLocalDateParts(fromDate, timeZone);
  const end = makeInstantForTimeZone(startParts.year, startParts.month - 1, startParts.day + 60, 0, timeZone);
  const bestByDay = new Map<string, {
    date: Date;
    body: Body;
    separation: number;
  }>();

  for (let dayOffset = 0; dayOffset < 60; dayOffset += 1) {
    for (const hour of [18, 21, 0, 3]) {
      const date = makeInstantForTimeZone(startParts.year, startParts.month - 1, startParts.day + dayOffset, hour, timeZone);
      if (date < fromDate || date >= end) continue;

      const sunEq = Equator(Body.Sun, date, observer, true, true);
      const sunHor = Horizon(date, observer, sunEq.ra, sunEq.dec, 'normal');
      if (sunHor.altitude > -6) continue;

      const moonEq = Equator(Body.Moon, date, observer, true, true);
      const moonHor = Horizon(date, observer, moonEq.ra, moonEq.dec, 'normal');
      if (moonHor.altitude <= 5) continue;

      for (const planet of planetsForCloseApproach) {
        const planetEq = Equator(planet.body, date, observer, true, true);
        const planetHor = Horizon(date, observer, planetEq.ra, planetEq.dec, 'normal');
        if (planetHor.altitude <= 5) continue;

        const separation = angularSeparation(moonEq.ra, moonEq.dec, planetEq.ra, planetEq.dec);
        if (separation > planet.threshold) continue;

        const key = `${planet.body}-${getDateKeyInTimeZone(date, timeZone)}`;
        const currentBest = bestByDay.get(key);
        if (!currentBest || separation < currentBest.separation) {
          bestByDay.set(key, { date, body: planet.body, separation });
        }
      }
    }
  }

  return Array.from(bestByDay.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 24)
    .map(event => ({
      dateMs: event.date.getTime(),
      body: event.body as string,
      separation: event.separation
    }));
};

export const computeAstroEventSearchRaw = (
  fromDate: Date,
  timeZone?: string,
  location?: Pick<LocationData, 'latitude' | 'longitude'>,
): RawAstroEventSearch => {
  const fallback = DEFAULT_OBSERVER_LOCATION;
  return {
    eclipses: computeEclipseEventsRaw(fromDate, timeZone),
    approaches: computePlanetCloseApproachesRaw(
      fromDate,
      location?.latitude ?? fallback.latitude,
      location?.longitude ?? fallback.longitude,
      timeZone,
    )
  };
};
