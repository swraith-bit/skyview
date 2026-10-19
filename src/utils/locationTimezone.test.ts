import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveTimezoneForCoordinates } from './locationTimezone';

describe('resolveTimezoneForCoordinates', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the timezone returned by Open-Meteo', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ timezone: 'Asia/Tokyo' }), { status: 200 })));

    await expect(resolveTimezoneForCoordinates(35.6762, 139.6503)).resolves.toBe('Asia/Tokyo');
  });

  it('falls back to the device timezone when the lookup fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));

    await expect(resolveTimezoneForCoordinates(0, 0)).resolves.toBe(
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    );
  });
});
