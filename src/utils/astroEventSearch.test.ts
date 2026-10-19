import { describe, expect, it } from 'vitest';
import {
  computeAstroEventSearchRaw,
  computeEclipseEventsRaw,
  computePlanetCloseApproachesRaw,
  DEFAULT_OBSERVER_LOCATION,
} from './astroEventSearch';

describe('computeEclipseEventsRaw (F3.5)', () => {
  it('finds solar and lunar eclipses inside the three-year window', () => {
    const fromDate = new Date('2026-06-15T00:00:00Z');
    const eclipses = computeEclipseEventsRaw(fromDate, 'Europe/Istanbul');

    expect(eclipses.length).toBeGreaterThan(0);
    expect(eclipses.some(eclipse => eclipse.kind === 'solar')).toBe(true);
    expect(eclipses.some(eclipse => eclipse.kind === 'lunar')).toBe(true);

    const yearStart = new Date('2025-12-31T00:00:00Z').getTime();
    const windowEnd = new Date('2029-01-02T00:00:00Z').getTime();
    for (const eclipse of eclipses) {
      expect(eclipse.dateMs).toBeGreaterThanOrEqual(yearStart);
      expect(eclipse.dateMs).toBeLessThan(windowEnd);
      expect(Number.isFinite(eclipse.dateMs)).toBe(true);
    }
  });

  it('keeps obscuration only as serializable plain rows', () => {
    const eclipses = computeEclipseEventsRaw(new Date('2026-01-01T00:00:00Z'), undefined);
    for (const eclipse of eclipses) {
      expect(typeof eclipse.eclipseKind).toBe('string');
      if (eclipse.obscuration !== undefined) {
        expect(eclipse.obscuration).toBeGreaterThanOrEqual(0);
        expect(eclipse.obscuration).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('computePlanetCloseApproachesRaw (F3.5)', () => {
  it('caps results at 24 rows within the union threshold', () => {
    const approaches = computePlanetCloseApproachesRaw(
      new Date('2026-06-15T00:00:00Z'),
      DEFAULT_OBSERVER_LOCATION.latitude,
      DEFAULT_OBSERVER_LOCATION.longitude,
      'Europe/Istanbul',
    );

    expect(approaches.length).toBeLessThanOrEqual(24);
    for (const approach of approaches) {
      expect(approach.separation).toBeLessThanOrEqual(6);
      expect(Number.isFinite(approach.separation)).toBe(true);
    }
  });

  it('returns approaches in chronological order', () => {
    const approaches = computePlanetCloseApproachesRaw(
      new Date('2026-06-15T00:00:00Z'),
      41.0082,
      28.9784,
      'Europe/Istanbul',
    );
    for (let index = 1; index < approaches.length; index += 1) {
      expect(approaches[index]?.dateMs).toBeGreaterThanOrEqual(approaches[index - 1]!.dateMs);
    }
  });
});

describe('computeAstroEventSearchRaw (F3.5)', () => {
  it('falls back to the default observer location without coordinates', () => {
    const search = computeAstroEventSearchRaw(new Date('2026-01-01T00:00:00Z'), undefined, undefined);
    expect(Array.isArray(search.eclipses)).toBe(true);
    expect(Array.isArray(search.approaches)).toBe(true);
  });
});
