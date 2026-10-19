import { HourlyData, TonightTarget } from '../types';
import { RawAstroEventSearch } from '../utils/astroEventSearch';

export interface TonightTargetsRequest {
  date: string;
  latitude: number;
  longitude: number;
  weather: number | HourlyData;
}

export interface AstroEventsWorkerRequest {
  fromMs: number;
  latitude: number;
  longitude: number;
  timeZone?: string;
}

interface WorkerReply {
  id: number;
  targets?: TonightTarget[];
  eclipses?: RawAstroEventSearch['eclipses'];
  approaches?: RawAstroEventSearch['approaches'];
}

type WorkerFactory = () => Worker | null;

const defaultWorkerFactory: WorkerFactory = () => {
  try {
    return new Worker(new URL('./astronomy.worker.ts', import.meta.url), { type: 'module' });
  } catch {
    return null;
  }
};

// F3.1: the astronomy worker is a module-scope lazy singleton. Every
// useTonightTargets consumer posts a request-id-tagged job to the same worker
// instead of creating and terminating a fresh Worker on each minute tick.
let worker: Worker | null = null;
let workerFactory: WorkerFactory = defaultWorkerFactory;
let nextRequestId = 1;
const pending = new Map<number, {
  onReply: (reply: WorkerReply) => void;
  onError: () => void;
}>();

const attachRouter = (instance: Worker): void => {
  instance.onmessage = (event: MessageEvent<WorkerReply>) => {
    const reply = event.data;
    const request = reply ? pending.get(reply.id) : undefined;
    if (!request) return;
    pending.delete(reply.id);
    request.onReply(reply);
  };
  instance.onerror = () => {
    // Route the failure to every in-flight request and drop the dead instance so
    // the next request can retry creation; consumers fall back to the main thread.
    const failed = Array.from(pending.values());
    pending.clear();
    failed.forEach(request => request.onError());
    worker = null;
  };
};

const ensureWorker = (): Worker | null => {
  if (worker) return worker;
  const created = workerFactory();
  if (!created) return null;
  attachRouter(created);
  worker = created;
  return worker;
};

export const requestTonightTargetsFromWorker = (
  request: TonightTargetsRequest,
  onTargets: (targets: TonightTarget[]) => void,
  onError: () => void,
): (() => void) => {
  const instance = ensureWorker();
  if (!instance) {
    onError();
    return () => undefined;
  }
  const id = nextRequestId;
  nextRequestId += 1;
  pending.set(id, { onReply: reply => onTargets(reply.targets ?? []), onError });
  instance.postMessage({ id, ...request });
  return () => {
    pending.delete(id);
  };
};

// F3.5: the second consumer of the shared singleton worker — the heavy
// astro-event search runs off the main thread and replies with plain
// serializable rows (dates as epoch ms) for main-thread i18n formatting.
export const requestAstroEventsFromWorker = (
  request: AstroEventsWorkerRequest,
  onEvents: (search: RawAstroEventSearch) => void,
  onError: () => void,
): (() => void) => {
  const instance = ensureWorker();
  if (!instance) {
    onError();
    return () => undefined;
  }
  const id = nextRequestId;
  nextRequestId += 1;
  pending.set(id, {
    onReply: reply => onEvents({
      eclipses: reply.eclipses ?? [],
      approaches: reply.approaches ?? [],
    }),
    onError,
  });
  instance.postMessage({ id, kind: 'events', ...request });
  return () => {
    pending.delete(id);
  };
};

// Test seam: swap the worker construction strategy and reset singleton state.
export const configureAstronomyWorkerClientForTests = (factory?: WorkerFactory): void => {
  workerFactory = factory ?? defaultWorkerFactory;
  if (worker) worker.terminate();
  worker = null;
  pending.clear();
};
