import { describe, expect, it } from 'vitest';
import {
  filterUpcomingIndices,
  findAnchorIndexForDay,
  groupHourlyIndicesByLocalDay,
  nightWindowIndicesForDay,
} from './plannerNightWindow';

const HOUR = 3_600_000;

/** 2026-07-14 18:00 UTC = 21:00 Europe/Istanbul (= UTC+3, no DST). */
const istanbulEveningSec = Math.floor(Date.UTC(2026, 6, 14, 18, 0, 0) / 1000);

describe('groupHourlyIndicesByLocalDay', () => {
  it('groups sample indices by target-timezone day, not by UTC day', () => {
    // 2026-07-14 15:00 UTC is already July 15 in the 14h-mark? No: Tokyo = UTC+9 → July 15, 00:00.
    const times = [
      Math.floor(Date.UTC(2026, 6, 14, 14, 0, 0) / 1000), // Tokyo: 23:00 July 14
      Math.floor(Date.UTC(2026, 6, 14, 15, 0, 0) / 1000), // Tokyo: 00:00 July 15
      Math.floor(Date.UTC(2026, 6, 14, 16, 0, 0) / 1000), // Tokyo: 01:00 July 15
    ];

    const groups = groupHourlyIndicesByLocalDay(times, 'Asia/Tokyo');

    expect(groups.get('2026-07-14')).toEqual([0]);
    expect(groups.get('2026-07-15')).toEqual([1, 2]);
  });

  it('returns no groups for an empty series (no NaN plans)', () => {
    expect(groupHourlyIndicesByLocalDay([], 'Europe/Istanbul').size).toBe(0);
  });
});

describe('nightWindowIndicesForDay', () => {
  it('keeps the 20:00+ evening hours and the next-day ≤ 04:00 night hours', () => {
    const times: number[] = [];
    const push = (utcHour: number) => times.push(Math.floor((Date.UTC(2026, 6, 14, utcHour, 0, 0)) / 1000));
    [16, 17, 18, 19, 20, 21, 22, 23].forEach(push);           // day group: 19:00–02:00 İstanbul
    const nextDayCount = Array.from({ length: 8 }, (_, h) => h).map(h =>
      times.push(Math.floor((Date.UTC(2026, 6, 15, h - 3, 0, 0)) / 1000))); // next day 00:00–04:00 local
    void nextDayCount;

    const groups = groupHourlyIndicesByLocalDay(times, 'Europe/Istanbul');
    const dayGroup = groups.get('2026-07-14');
    const nextGroup = groups.get('2026-07-15');

    const night = nightWindowIndicesForDay(times, dayGroup, nextGroup, 'Europe/Istanbul');

    // Evening hours 20:00–23:00 (indices 1..4) + next-day 00:00–04:00 (indices 5..12).
    expect(night).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('returns an empty list when the day has no samples at all', () => {
    expect(nightWindowIndicesForDay([istanbulEveningSec], undefined, undefined, 'Europe/Istanbul')).toEqual([]);
  });
});

describe('findAnchorIndexForDay', () => {
  it('prefers the 21:00 sample and never invents an index', () => {
    // İstanbul midnight series 20:00–01:00 contains 21:00 local.
    expect(findAnchorIndexForDay([istanbulEveningSec], [0], 'Europe/Istanbul')).toBe(0);
    expect(findAnchorIndexForDay([istanbulEveningSec], undefined, 'Europe/Istanbul')).toBe(-1);
  });

  it('prefers 21:00, falls back to the first real sample when absent, never invents', () => {
    // İstanbul midnight series 20:00–01:00 contains 21:00 local.
    expect(findAnchorIndexForDay([istanbulEveningSec], [0], 'Europe/Istanbul')).toBe(0);
    expect(findAnchorIndexForDay([istanbulEveningSec], undefined, 'Europe/Istanbul')).toBe(-1);

    // Truncated last day without a 21:00 sample (ends at local 20:00).
    const shortDay = [
      Math.floor(Date.UTC(2026, 6, 21, 16, 0, 0) / 1000), // 19:00 İstanbul
      Math.floor(Date.UTC(2026, 6, 21, 17, 0, 0) / 1000), // 20:00
    ];
    const shortGroups = groupHourlyIndicesByLocalDay(shortDay, 'Europe/Istanbul');
    expect(findAnchorIndexForDay(shortDay, shortGroups.get('2026-07-21'), 'Europe/Istanbul')).toBe(0);
  });

  it('survives a DST-transition day with a missing local hour', () => {
    // Europe/Berlin, 2026-03-29: 02:00→03:00 spring-forward — a full-day hourly
    // series has 23 local samples; both indices must still be real timestamps.
    const dstDay = Array.from({ length: 26 }, (_, h) =>
      Math.floor((Date.UTC(2026, 2, 28, 21, 0, 0) + h * HOUR) / 1000));
    const groups = groupHourlyIndicesByLocalDay(dstDay, 'Europe/Berlin');
    const dayGroup = groups.get('2026-03-29');
    const nextGroup = groups.get('2026-03-30');

    expect(dayGroup!.length).toBeGreaterThan(0);
    const anchor = findAnchorIndexForDay(dstDay, dayGroup, 'Europe/Berlin');
    expect(anchor).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(dstDay[anchor])).toBe(true);
    expect(() => nightWindowIndicesForDay(dstDay, dayGroup, nextGroup, 'Europe/Berlin')).not.toThrow();
  });
});

describe('filterUpcomingIndices', () => {
  it('drops samples that are already in the past', () => {
    const now = istanbulEveningSec * 1000;
    const pastHourSec = Math.floor((now - HOUR) / 1000);
    const futureHourSec = Math.floor((now + HOUR) / 1000);

    expect(filterUpcomingIndices([0, 1], [pastHourSec, futureHourSec], now)).toEqual([1]);
  });
});
