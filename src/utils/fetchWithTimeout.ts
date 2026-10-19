export class FetchTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'FetchTimeoutError';
  }
}

export const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 10_000,
): Promise<Response> => {
  const controller = new AbortController();
  let didTimeout = false;
  const abortFromCaller = () => controller.abort();

  if (init.signal) {
    if (init.signal.aborted) {
      controller.abort();
    } else {
      init.signal.addEventListener('abort', abortFromCaller, { once: true });
    }
  }

  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (didTimeout) throw new FetchTimeoutError(timeoutMs);
    throw error;
  } finally {
    clearTimeout(timeoutId);
    init.signal?.removeEventListener('abort', abortFromCaller);
  }
};

/** Minimal response envelope for {@link fetchJsonWithTimeout}. */
export interface JsonResponse {
  status: number;
  ok: boolean;
  /** Pre-read JSON body (timeout failure while reading maps to FetchTimeoutError). */
  data: unknown;
}

/**
 * F4.4: JSON fetch whose *body read* is covered by the same timeout budget as
 * the headers. {@link fetchWithTimeout} only covered the header phase, so a
 * stalled response body could hang the caller forever. One AbortController
 * now spans both phases.
 */
export const fetchJsonWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 10_000,
): Promise<JsonResponse> => {
  const controller = new AbortController();
  let didTimeout = false;
  const abortFromCaller = () => controller.abort();

  if (init.signal) {
    if (init.signal.aborted) {
      controller.abort();
    } else {
      init.signal.addEventListener('abort', abortFromCaller, { once: true });
    }
  }

  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    // Error bodies are not consumed by callers — skip the read (and possible
    // parse) so HTTP status handling stays the single failure path.
    const data = response.ok ? await response.json() : null;
    return { status: response.status, ok: response.ok, data };
  } catch (error) {
    if (didTimeout) throw new FetchTimeoutError(timeoutMs);
    throw error;
  } finally {
    clearTimeout(timeoutId);
    init.signal?.removeEventListener('abort', abortFromCaller);
  }
};
