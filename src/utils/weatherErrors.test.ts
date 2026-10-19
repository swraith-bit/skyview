import { describe, expect, it } from 'vitest';
import { classifyWeatherError } from './weatherErrors';
import { FetchTimeoutError } from './fetchWithTimeout';

describe('F4.5 weather error channels', () => {
  it('reports offline when the flag or the fetch-time snapshot says so', () => {
    expect(classifyWeatherError(new Error('boom'), false)).toBe('offline');
    expect(classifyWeatherError(new Error('Offline'), true)).toBe('offline');
    expect(classifyWeatherError(new TypeError('Failed to fetch'), true)).toBe('offline');
    expect(classifyWeatherError(new TypeError('Network request failed'), true)).toBe('offline');
  });

  it('separates timeouts from connection problems', () => {
    expect(classifyWeatherError(new FetchTimeoutError(10_000), true)).toBe('timeout');
    expect(classifyWeatherError(new Error('Request timed out after 10000ms'), true)).toBe('timeout');
  });

  it('maps provider outages, throttling and contract drift to the server channel', () => {
    expect(classifyWeatherError(new Error('HTTP_502'), true)).toBe('server');
    expect(classifyWeatherError(new Error('HTTP_503'), true)).toBe('server');
    expect(classifyWeatherError(new Error('HTTP_429'), true)).toBe('server');
    expect(classifyWeatherError(new Error('INVALID_API_RESPONSE:family="weather"'), true)).toBe('server');
  });

  it('keeps 4xx responses out of the server channel', () => {
    expect(classifyWeatherError(new Error('HTTP_400'), true)).toBe('unknown');
    expect(classifyWeatherError(new Error('HTTP_403'), true)).toBe('unknown');
  });

  it('falls back to unknown for unpredicted failures', () => {
    expect(classifyWeatherError(new Error('boom'), true)).toBe('unknown');
    expect(classifyWeatherError('FETCH_FAILED', true)).toBe('unknown');
    expect(classifyWeatherError(undefined, true)).toBe('unknown');
  });
});
