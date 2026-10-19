import { describe, expect, it } from 'vitest';
import { calculateAstroPhotoWindow, formatGuideTime } from './arPhotoGuide';

describe('AR photo guide', () => {
  it('selects the longest consecutive clear and calm night window', () => {
    const result = calculateAstroPhotoWindow({
      time: [
        '2026-07-14T17:00:00Z',
        '2026-07-14T18:00:00Z',
        '2026-07-14T19:00:00Z',
        '2026-07-14T20:00:00Z',
        '2026-07-14T21:00:00Z',
        '2026-07-14T22:00:00Z',
      ],
      cloudCover: [5, 8, 40, 10, 12, 13],
      windspeed: [5, 7, 4, 10, 12, 14],
    }, 'Europe/Istanbul');

    expect(result).toMatchObject({ start: '23:00', end: '01:00', avgWind: 12 });
  });

  it('returns no window when conditions are unsuitable', () => {
    expect(calculateAstroPhotoWindow({
      time: ['2026-07-14T20:00:00Z'],
      cloudCover: [80],
      windspeed: [30],
    }, 'UTC')).toBeNull();
  });

  it('formats missing values safely', () => {
    expect(formatGuideTime(undefined, 'UTC')).toBe('--:--');
  });
});
