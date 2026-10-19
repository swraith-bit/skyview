import { describe, expect, it } from 'vitest';
import {
  apodSchema,
  kpResponseSchema,
  openMeteoWeatherSchema,
  parseContract,
  timezoneResponseSchema,
  tleCatalogSchema,
} from './apiSchemas';

describe('API contracts', () => {
  it('accepts a complete Open-Meteo payload and rejects mismatched arrays', () => {
    const payload = {
      current: { temperature_2m: 12, relative_humidity_2m: 55, cloud_cover: 20, wind_speed_10m: 7 },
      hourly: { time: [1, 2], cloud_cover: [20, 30], wind_speed_10m: [4, 5] },
    };
    expect(openMeteoWeatherSchema.safeParse(payload).success).toBe(true);
    expect(openMeteoWeatherSchema.safeParse({ ...payload, hourly: { ...payload.hourly, cloud_cover: [20] } }).success).toBe(false);
  });

  it('rejects malformed APOD, timezone and TLE responses', () => {
    expect(apodSchema.safeParse({ title: 'Space', explanation: 'x', url: 'not-a-url', media_type: 'image', date: '2026-01-01' }).success).toBe(false);
    expect(apodSchema.safeParse({ title: 'Space', explanation: 'x', url: 'javascript:alert(1)', media_type: 'image', date: '2026-01-01' }).success).toBe(false);
    expect(apodSchema.safeParse({ title: 'Space', explanation: 'x', url: 'data:text/html,test', media_type: 'video', date: '2026-01-01' }).success).toBe(false);
    expect(apodSchema.safeParse({ title: 'Space', explanation: 'x', url: 'https://apod.nasa.gov/image.jpg', media_type: 'image', date: '2026-01-01' }).success).toBe(true);
    // F1.5: legacy http:// archive media is accepted instead of dropping the whole entry.
    expect(apodSchema.safeParse({ title: 'Space', explanation: 'x', url: 'http://apod.nasa.gov/image.jpg', media_type: 'image', date: '2026-01-01' }).success).toBe(true);
    expect(apodSchema.safeParse({ title: 'Space', explanation: 'x', url: 'ftp://apod.nasa.gov/image.jpg', media_type: 'image', date: '2026-01-01' }).success).toBe(false);
    expect(timezoneResponseSchema.safeParse({ timezone: '' }).success).toBe(false);
    expect(tleCatalogSchema.safeParse([{ OBJECT_NAME: 'ISS', NORAD_CAT_ID: 25544, TLE_LINE1: 'broken', TLE_LINE2: '2 valid' }]).success).toBe(false);
  });

  it('accepts NOAA table and object row formats', () => {
    expect(kpResponseSchema.safeParse([['time_tag', 'Kp'], ['2026-01-01', '4.3']]).success).toBe(true);
    expect(kpResponseSchema.safeParse([{ Kp: 5 }]).success).toBe(true);
  });

  it('throws a source-tagged error without leaking response content', () => {
    expect(() => parseContract('NASA APOD', apodSchema, { error: 'secret upstream body' }))
      .toThrow('INVALID_API_RESPONSE:NASA APOD');
  });
});
