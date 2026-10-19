import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  configureAstronomyWorkerClientForTests,
  requestAstroEventsFromWorker,
  requestTonightTargetsFromWorker,
} from './astronomyWorkerClient';
import { TonightTarget } from '../types';

class FakeWorker {
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  readonly postMessage = vi.fn();
  readonly terminate = vi.fn();
}

const asMessageEvent = (data: unknown): MessageEvent => ({ data }) as unknown as MessageEvent;

describe('astronomyWorkerClient singleton (F3.1)', () => {
  let created: FakeWorker[];

  beforeEach(() => {
    created = [];
    configureAstronomyWorkerClientForTests(() => {
      const instance = new FakeWorker();
      created.push(instance);
      return instance as unknown as Worker;
    });
  });

  afterEach(() => {
    configureAstronomyWorkerClientForTests();
  });

  it('serves ten sequential consumers with a single lazily created worker', () => {
    const results: TonightTarget[][] = [];
    const errors = vi.fn();

    for (let index = 0; index < 10; index += 1) {
      requestTonightTargetsFromWorker(
        { date: new Date(0).toISOString(), latitude: 39, longitude: 35, weather: 50 },
        targets => results.push(targets),
        errors,
      );
    }

    expect(created).toHaveLength(1);
    expect(created[0]!.postMessage).toHaveBeenCalledTimes(10);
    expect(errors).not.toHaveBeenCalled();

    // Replies may arrive out of order on a shared worker; ids route them.
    created[0]!.postMessage.mock.calls.forEach((call, index) => {
      const { id } = call[0] as { id: number };
      created[0]!.onmessage?.(asMessageEvent({ id, targets: [{ id: `t${index}` }] }));
    });

    expect(results).toHaveLength(10);
  });

  it('routes a dead worker error to in-flight requests and recreates on the next request', () => {
    const errors = vi.fn();
    requestTonightTargetsFromWorker(
      { date: new Date(0).toISOString(), latitude: 39, longitude: 35, weather: 50 },
      () => undefined,
      errors,
    );

    created[0]!.onerror?.({});

    expect(errors).toHaveBeenCalledTimes(1);

    requestTonightTargetsFromWorker(
      { date: new Date(0).toISOString(), latitude: 39, longitude: 35, weather: 50 },
      () => undefined,
      () => undefined,
    );

    expect(created).toHaveLength(2);
  });

  it('cancelled requests ignore late replies', () => {
    const onTargets = vi.fn();
    const cancel = requestTonightTargetsFromWorker(
      { date: new Date(0).toISOString(), latitude: 39, longitude: 35, weather: 50 },
      onTargets,
      () => undefined,
    );

    cancel();
    const { id } = created[0]!.postMessage.mock.calls[0]![0] as { id: number };
    created[0]!.onmessage?.(asMessageEvent({ id, targets: [] }));

    expect(onTargets).not.toHaveBeenCalled();
  });

  it('reports a construction failure synchronously without throwing', () => {
    configureAstronomyWorkerClientForTests(() => null);
    const onTargets = vi.fn();
    const onError = vi.fn();

    const cancel = requestTonightTargetsFromWorker(
      { date: new Date(0).toISOString(), latitude: 39, longitude: 35, weather: 50 },
      onTargets,
      onError,
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(() => cancel()).not.toThrow();
  });

  it('routes astro-events replies by request id on the shared worker (F3.5)', () => {
    const onEvents = vi.fn();
    const errors = vi.fn();

    requestTonightTargetsFromWorker(
      { date: new Date(0).toISOString(), latitude: 39, longitude: 35, weather: 50 },
      () => undefined,
      () => undefined,
    );
    requestAstroEventsFromWorker(
      { fromMs: 0, latitude: 41, longitude: 29, timeZone: 'Europe/Istanbul' },
      onEvents,
      errors,
    );

    expect(created).toHaveLength(1);
    const [eventsCall] = created[0]!.postMessage.mock.calls.slice(-1);
    const message = eventsCall![0] as { id: number; kind: string; timeZone?: string };
    expect(message.kind).toBe('events');
    expect(message.timeZone).toBe('Europe/Istanbul');

    created[0]!.onmessage?.(asMessageEvent({
      id: message.id,
      eclipses: [{ dateMs: 0, kind: 'lunar', eclipseKind: 'total' }],
      approaches: [],
    }));

    expect(onEvents).toHaveBeenCalledWith({
      eclipses: [{ dateMs: 0, kind: 'lunar', eclipseKind: 'total' }],
      approaches: [],
    });
    expect(errors).not.toHaveBeenCalled();
  });

  it('routes a dead worker error to in-flight astro-events requests (F3.5)', () => {
    const onEvents = vi.fn();
    const errors = vi.fn();

    requestAstroEventsFromWorker(
      { fromMs: 0, latitude: 41, longitude: 29 },
      onEvents,
      errors,
    );

    created[0]!.onerror?.({});

    expect(errors).toHaveBeenCalledTimes(1);
    expect(onEvents).not.toHaveBeenCalled();
  });
});
