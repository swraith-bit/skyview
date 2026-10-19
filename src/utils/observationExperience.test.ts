import { describe, expect, it, vi } from 'vitest';
import { calculateDarknessWindow } from './observationExperience';

describe('observation experience', () => {
  it('returns no window when every hourly forecast is overcast', () => {
    const now = new Date('2026-07-11T18:00:00Z');
    const times = Array.from({ length: 36 }, (_, index) => Math.floor((now.getTime() + index * 3600_000) / 1000));
    const result = calculateDarknessWindow(now, { name: 'Istanbul', latitude: 41.0082, longitude: 28.9784 }, {
      time: times,
      cloudCover: Array(36).fill(100),
      windspeed: Array(36).fill(5),
    }, 100);
    expect(result).toBeNull();
  });

  it('finds a dark window under clear conditions during a new moon', () => {
    vi.setSystemTime(new Date('2026-06-15T18:00:00Z'));
    const now = new Date('2026-06-15T18:00:00Z');
    const times = Array.from({ length: 36 }, (_, index) => Math.floor((now.getTime() + index * 3600_000) / 1000));
    const result = calculateDarknessWindow(now, { name: 'Istanbul', latitude: 41.0082, longitude: 28.9784 }, {
      time: times,
      cloudCover: Array(36).fill(5),
      windspeed: Array(36).fill(5),
    }, 5);
    expect(result?.durationMinutes).toBeGreaterThan(0);
    vi.useRealTimers();
  });
});
