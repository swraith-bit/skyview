import { describe, expect, it } from 'vitest';
import { estimateBortleScale, getAstroEvents } from './events';
import { buildShowers, getShowerName } from './showers';

describe('estimateBortleScale', () => {
  it('classifies a major city as heavily light polluted', () => {
    expect(estimateBortleScale(34.0522, -118.2437)).toBeGreaterThanOrEqual(8);
  });

  it('preserves known dark-sky site overrides', () => {
    expect(estimateBortleScale(19.825, -155.4742)).toBe(1);
  });

  it('does not call an unknown remote coordinate pristine', () => {
    expect(estimateBortleScale(0, -140)).toBeGreaterThanOrEqual(4);
  });
});

describe('meteor events', () => {
  it('uses the shared meteor shower catalog for upcoming astronomy events', () => {
    const timeZone = 'Europe/Istanbul';
    const year = 2026;
    const meteorEvents = getAstroEvents('en', timeZone, new Date('2026-01-01T00:00:00Z'))
      .filter(event => event.type === 'meteor');
    const eventDates = new Set(meteorEvents.map(event => event.date.toISOString()));

    for (const shower of buildShowers(year, timeZone)) {
      expect(eventDates.has(shower.peak.toISOString())).toBe(true);
      expect(meteorEvents.some(event =>
        event.date.toISOString() === shower.peak.toISOString()
        && event.title.includes(getShowerName(shower.name, 'en')))).toBe(true);
    }
  });
});
