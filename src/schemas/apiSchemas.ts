import { z } from 'zod';

const finiteNumber = z.number().finite();
const finiteNumberArray = z.array(finiteNumber);

// F1.5: old APOD archive entries may still point at http:// media paths. Rendering stays
// https-first through the safeUrl helpers; the contract just stops discarding those entries.
const apodMediaUrl = z.string().url().refine(value => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}, 'APOD media URLs must be http(s)');

export const openMeteoWeatherSchema = z.object({
  current: z.object({
    temperature_2m: finiteNumber,
    relative_humidity_2m: finiteNumber,
    cloud_cover: finiteNumber,
    wind_speed_10m: finiteNumber,
  }),
  hourly: z.object({
    time: finiteNumberArray,
    cloud_cover: finiteNumberArray,
    wind_speed_10m: finiteNumberArray,
  }),
  timezone: z.string().min(1).optional(),
}).superRefine((value, context) => {
  const size = value.hourly.time.length;
  if (value.hourly.cloud_cover.length !== size || value.hourly.wind_speed_10m.length !== size) {
    context.addIssue({ code: 'custom', message: 'Hourly arrays must have equal lengths', path: ['hourly'] });
  }
});

export const apodSchema = z.object({
  title: z.string().min(1),
  explanation: z.string().min(1),
  url: apodMediaUrl,
  hdurl: apodMediaUrl.optional(),
  media_type: z.enum(['image', 'video']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  copyright: z.string().optional(),
});

const kpRowSchema = z.union([
  z.array(z.unknown()).min(2),
  z.object({ Kp: z.union([z.number(), z.string()]) }).passthrough(),
]);
export const kpResponseSchema = z.array(kpRowSchema).min(1);

export const reverseGeocodeSchema = z.object({
  address: z.object({
    city: z.string().optional(),
    town: z.string().optional(),
    village: z.string().optional(),
    municipality: z.string().optional(),
    county: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

export const timezoneResponseSchema = z.object({ timezone: z.string().min(1) });

export const geocodingResponseSchema = z.object({
  results: z.array(z.object({
    name: z.string().min(1),
    latitude: finiteNumber,
    longitude: finiteNumber,
    country: z.string().optional(),
    timezone: z.string().optional(),
  })).optional(),
});

export const issPositionSchema = z.object({
  latitude: finiteNumber,
  longitude: finiteNumber,
  altitude: finiteNumber,
  velocity: finiteNumber,
});

export const issPassSchema = z.object({
  rise: z.object({ time: z.string().min(1) }),
  duration_sec: finiteNumber.nonnegative(),
  visible: z.boolean(),
});
export const issPassResponseSchema = z.object({ passes: z.array(issPassSchema).default([]) });

export const tleObjectSchema = z.object({
  OBJECT_NAME: z.string().min(1),
  NORAD_CAT_ID: z.number().int().positive(),
  TLE_LINE1: z.string().regex(/^1\s/),
  TLE_LINE2: z.string().regex(/^2\s/),
});
export const tleCatalogSchema = z.array(tleObjectSchema).min(1);

export class ApiContractError extends Error {
  constructor(public readonly source: string) {
    super(`INVALID_API_RESPONSE:${source}`);
    this.name = 'ApiContractError';
  }
}

export const parseContract = <T>(source: string, schema: z.ZodType<T>, value: unknown): T => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new ApiContractError(source);
  return parsed.data;
};
