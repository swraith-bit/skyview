/// <reference lib="webworker" />
import { getTonightTargets } from '../utils/astronomy';
import { computeAstroEventSearchRaw } from '../utils/astroEventSearch';
import { HourlyData } from '../types';

interface TonightRequest {
  // F3.1: the shared singleton worker echoes the request id so concurrent
  // consumers can match responses to their own request.
  id: number;
  kind?: 'tonight';
  date: string;
  latitude: number;
  longitude: number;
  weather: number | HourlyData;
}

// F3.5: heavy astro-event search (3-year eclipses + 60-day planet sweeps)
// computed off the main thread; the main thread keeps the i18n formatting.
interface EventsRequest {
  id: number;
  kind: 'events';
  fromMs: number;
  latitude: number;
  longitude: number;
  timeZone?: string;
}

type WorkerRequest = TonightRequest | EventsRequest;

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  if (request.kind === 'events') {
    const { id, fromMs, latitude, longitude, timeZone } = request;
    const search = computeAstroEventSearchRaw(new Date(fromMs), timeZone, { latitude, longitude });
    self.postMessage({ id, eclipses: search.eclipses, approaches: search.approaches });
    return;
  }
  const { id, date, latitude, longitude, weather } = request;
  const targets = getTonightTargets(new Date(date), latitude, longitude, weather);
  self.postMessage({ id, targets });
};

export {};
