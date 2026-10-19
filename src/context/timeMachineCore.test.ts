import { describe, expect, it } from 'vitest';
import { MAX_TIME_OFFSET_MINUTES, clampOffsetMinutes, shiftInstant } from './timeMachineCore';

describe('global time machine helpers', () => {
  it('clamps offsets to the supported night range', () => {
    expect(clampOffsetMinutes(-30)).toBe(0);
    expect(clampOffsetMinutes(90)).toBe(90);
    expect(clampOffsetMinutes(MAX_TIME_OFFSET_MINUTES + 300)).toBe(MAX_TIME_OFFSET_MINUTES);
    expect(clampOffsetMinutes(Number.NaN)).toBe(0);
  });

  it('rounds fractional minutes and shifts the instant', () => {
    const now = new Date('2026-10-19T21:00:00.000Z');
    expect(shiftInstant(now, 90).toISOString()).toBe('2026-10-19T22:30:00.000Z');
    expect(clampOffsetMinutes(14.6)).toBe(15);
  });

  it('returns the same instant when the offset is zero', () => {
    const now = new Date('2026-10-19T21:00:00.000Z');
    expect(shiftInstant(now, 0).getTime()).toBe(now.getTime());
  });
});
