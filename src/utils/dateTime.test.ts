import { describe, expect, it } from 'vitest';
import { getDateKeyInTimeZone, getHourInTimeZone, formatCountdownToInstant } from './dateTime';

describe('time-zone helpers', () => {
  it('uses the selected location time zone instead of the device time zone', () => {
    const instant = new Date('2026-06-15T22:30:00Z');

    expect(getHourInTimeZone(instant, 'Europe/Istanbul')).toBe(1);
    expect(getDateKeyInTimeZone(instant, 'Europe/Istanbul')).toBe('2026-06-16');
    expect(getDateKeyInTimeZone(instant, 'America/New_York')).toBe('2026-06-15');
  });
});

describe('formatCountdownToInstant (F6.10 meteor peak countdown)', () => {
  const units = { days: 'gün', hours: 'sa', minutes: 'dk' };
  const now = new Date('2026-08-10T12:00:00Z');

  it('returns null for past or same-instant targets', () => {
    expect(formatCountdownToInstant(now, new Date('2026-08-10T11:59:59Z'), units)).toBeNull();
    expect(formatCountdownToInstant(now, now, units)).toBeNull();
  });

  it('formats sub-hour gaps as plain minutes', () => {
    expect(formatCountdownToInstant(now, new Date('2026-08-10T12:44:30Z'), units)).toBe('44 dk');
    expect(formatCountdownToInstant(now, new Date('2026-08-10T12:00:30Z'), units)).toBe('0 dk');
  });

  it('formats hour gaps with minute remainder and trims zero minutes', () => {
    expect(formatCountdownToInstant(now, new Date('2026-08-10T19:20:00Z'), units)).toBe('7 sa 20 dk');
    expect(formatCountdownToInstant(now, new Date('2026-08-10T19:00:00Z'), units)).toBe('7 sa');
  });

  it('formats multi-day gaps as days plus remaining hours', () => {
    expect(formatCountdownToInstant(now, new Date('2026-08-14T18:30:00Z'), units)).toBe('4 gün 6 sa');
    // tam gün — saat parçası yok
    expect(formatCountdownToInstant(now, new Date('2026-08-14T12:00:00Z'), units)).toBe('4 gün');
  });
});
