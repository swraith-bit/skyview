import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWeather } from './weatherService';

const location = {
  name: 'Istanbul',
  latitude: 41.0082,
  longitude: 28.9784,
  timezone: 'Europe/Istanbul',
};

describe('fetchWeather', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('normalizes a valid Open-Meteo response', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const nowSec = Math.floor(Date.now() / 1000);
    const hourlyTime = Array.from({ length: 40 }, (_, index) => nowSec - 3600 + index * 3600);

    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 12.4,
          relative_humidity_2m: 55,
          cloud_cover: 12,
          wind_speed_10m: 7.6,
        },
        hourly: {
          time: hourlyTime,
          cloud_cover: Array(40).fill(20),
          wind_speed_10m: Array(40).fill(8),
        },
      }),
    })));

    const data = await fetchWeather(location);

    expect(data.temp).toBe(12);
    expect(data.windSpeed).toBe(8);
    expect(data.suitability).toBe('excellent');
    expect(data.hourly.time).toHaveLength(36);
    expect(data.hourly.time[0]).toBeGreaterThan(nowSec);
  });

  it('rejects incomplete API responses before UI code can consume them', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 12,
          relative_humidity_2m: 55,
          cloud_cover: 20,
          wind_speed_10m: 7,
        },
        hourly: {
          time: [1, 2, 3],
          cloud_cover: [20, 30, 40],
        },
      }),
    })));

    await expect(fetchWeather(location)).rejects.toThrow('INVALID_API_RESPONSE');
  });
});
