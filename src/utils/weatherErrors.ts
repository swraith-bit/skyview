// F4.5 — Weather error message channels
//
// The old App.tsx branch looked for `error.message === 'FETCH_FAILED'` — a value that
// never occurs, so every failure rendered the generic "check your connection" text.
// This classifier maps the real failure lanes to user-facing channels:
//   offline  — no connection at request time, or the request dropped mid-flight
//   timeout  — the server answered too slowly (fetchWithTimeout)
//   server   — provider outage / throttling (HTTP 5xx, 429) or a contract violation
//   unknown  — everything else (4xx, unexpected shapes)

import { FetchTimeoutError } from './fetchWithTimeout';

export type WeatherErrorKind = 'offline' | 'timeout' | 'server' | 'unknown';

export const WEATHER_ERROR_KEYS: Record<WeatherErrorKind, string> = {
  offline: 'weather.offlineMsg',
  timeout: 'weather.timeoutMsg',
  server: 'weather.serverMsg',
  unknown: 'weather.unavailableMsg',
};

const networkDropPattern = /failed to fetch|network request failed/i;
const timeoutPattern = /timed out|abort/i;
const contractPattern = /^INVALID_API_RESPONSE:/;
const httpPattern = /^HTTP_(\d{3})$/;

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : typeof error === 'string' ? error : '';

export const classifyWeatherError = (error: unknown, isOnline = true): WeatherErrorKind => {
  const message = getErrorMessage(error);

  if (!isOnline || message === 'Offline' || networkDropPattern.test(message)) return 'offline';
  if (error instanceof FetchTimeoutError || timeoutPattern.test(message)) return 'timeout';

  const httpStatus = httpPattern.exec(message)?.[1];
  if (httpStatus !== undefined) {
    const status = Number(httpStatus);
    if (status >= 500 || status === 429) return 'server';
    return 'unknown';
  }

  if (contractPattern.test(message)) return 'server';
  return 'unknown';
};
