import { LocationData } from '../types';
import { getLocalDateParts } from '../utils/dateTime';

export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

export interface ObserverContext {
  instant: Date;
  latitude: number;
  longitude: number;
  timezone: string;
  elevationMeters: number;
  locationName: string;
}

export const normalizeTimeZone = (timeZone?: string): string => {
  const candidate = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  try {
    new Intl.DateTimeFormat('en', { timeZone: candidate }).format(0);
    return candidate;
  } catch {
    return 'UTC';
  }
};

export const createObserverContext = (
  location: LocationData,
  clock: Clock = systemClock,
  elevationMeters = 0,
): ObserverContext => ({
  instant: clock.now(),
  latitude: location.latitude,
  longitude: location.longitude,
  timezone: normalizeTimeZone(location.timezone),
  elevationMeters,
  locationName: location.name,
});

export const getObserverLocalDateKey = (observer: ObserverContext): string => {
  const parts = getLocalDateParts(observer.instant, observer.timezone);
  return `${parts.year}-${String(parts.month + 1).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
};
