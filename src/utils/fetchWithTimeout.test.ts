import { afterEach, describe, expect, it, vi } from 'vitest';
import { FetchTimeoutError, fetchJsonWithTimeout, fetchWithTimeout } from './fetchWithTimeout';

describe('fetchWithTimeout', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('returns a successful response', async () => {
    const response = new Response('ok', { status: 200 });
    const fetchMock = vi.fn(async () => response);
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchWithTimeout('https://example.test', {}, 1_000)).resolves.toBe(response);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('rejects with a timeout error when the request does not settle', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    })));

    const expectation = expect(fetchWithTimeout('https://example.test', {}, 1_000)).rejects.toBeInstanceOf(FetchTimeoutError);
    await vi.advanceTimersByTimeAsync(1_000);

    await expectation;
  });
});

describe('fetchJsonWithTimeout', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('returns a pre-parsed successful payload under the same budget', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ value: 42 }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchJsonWithTimeout('https://example.test', {}, 1_000))
      .resolves.toMatchObject({ status: 200, ok: true, data: { value: 42 } });
  });

  it('does not read the body of an unsuccessful response', async () => {
    const json = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, json })));

    const response = await fetchJsonWithTimeout('https://example.test', {}, 1_000);

    expect(response).toMatchObject({ status: 503, ok: false, data: null });
    expect(json).not.toHaveBeenCalled();
  });

  it('aborts a stalled fetch before the headers arrive', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    })));

    const expectation = expect(fetchJsonWithTimeout('https://example.test', {}, 1_000)).rejects.toBeInstanceOf(FetchTimeoutError);
    await vi.advanceTimersByTimeAsync(1_000);

    await expectation;
  });

  it('aborts a stalled JSON body read under the same budget (F4.4)', async () => {
    vi.useFakeTimers();
    // fetch receives the internal AbortController's signal; a stalled body read
    // must be rejected by that same controller when the timeout elapses.
    vi.stubGlobal('fetch', vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      const signal = init?.signal;
      const response = {
        ok: true,
        status: 200,
        json: () => new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(new Error('Body aborted')), { once: true });
        }),
      };
      return Promise.resolve(response as unknown as Response);
    }));

    const expectation = expect(fetchJsonWithTimeout('https://example.test', {}, 1_000)).rejects.toBeInstanceOf(FetchTimeoutError);
    await vi.advanceTimersByTimeAsync(1_000);

    await expectation;
  });
});
