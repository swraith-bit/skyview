import { describe, expect, it } from 'vitest';
import { createObserverContext, getObserverLocalDateKey, normalizeTimeZone } from './observerContext';

const instant = new Date('2026-01-01T01:30:00Z');

describe('observer context', () => {
  it('uses the selected location timezone at opposite sides of the date boundary', () => {
    const tokyo = createObserverContext(
      { name: 'Tokyo', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
      { now: () => instant },
    );
    const losAngeles = createObserverContext(
      { name: 'Los Angeles', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles' },
      { now: () => instant },
    );

    expect(getObserverLocalDateKey(tokyo)).toBe('2026-01-01');
    expect(getObserverLocalDateKey(losAngeles)).toBe('2025-12-31');
  });

  it('handles the international date line deterministically', () => {
    const kiribati = createObserverContext(
      { name: 'Kiritimati', latitude: 1.8721, longitude: -157.4278, timezone: 'Pacific/Kiritimati' },
      { now: () => new Date('2026-06-30T12:30:00Z') },
    );
    expect(getObserverLocalDateKey(kiribati)).toBe('2026-07-01');
  });

  it('falls back to UTC for an invalid timezone', () => {
    expect(normalizeTimeZone('Invalid/Zone')).toBe('UTC');
  });
});
