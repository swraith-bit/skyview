import { HourlyData } from '../../types';

export interface AstroPhotoWindow {
  start: string;
  end: string;
  avgWind: number;
}

const toDate = (timestamp: number | string): Date => (
  typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp)
);

// F3.6: formatters are cached per timezone — calculateAstroPhotoWindow used to
// build a fresh Intl.DateTimeFormat for every hourly sample.
const hourFormatterCache = new Map<string, Intl.DateTimeFormat>();
const timeFormatterCache = new Map<string, Intl.DateTimeFormat>();

const getHourFormatter = (timezone: string): Intl.DateTimeFormat => {
  const cached = hourFormatterCache.get(timezone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    hourCycle: 'h23',
    timeZone: timezone,
  });
  hourFormatterCache.set(timezone, formatter);
  return formatter;
};

const getTimeFormatter = (timezone: string): Intl.DateTimeFormat => {
  const cached = timeFormatterCache.get(timezone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: timezone,
  });
  timeFormatterCache.set(timezone, formatter);
  return formatter;
};

export const formatGuideTime = (date: Date | null | undefined, timezone?: string): string => {
  if (!date || Number.isNaN(date.getTime())) return '--:--';
  const resolvedTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return getTimeFormatter(resolvedTimezone).format(date);
};

export const calculateAstroPhotoWindow = (
  hourly: HourlyData | null,
  timezone?: string,
): AstroPhotoWindow | null => {
  if (!hourly?.time.length) return null;

  let currentSequence: number[] = [];
  let longestSequence: number[] = [];
  const commitSequence = () => {
    if (currentSequence.length > longestSequence.length) longestSequence = currentSequence;
    currentSequence = [];
  };

  const resolvedTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  for (let index = 0; index < hourly.time.length; index += 1) {
    const timestamp = hourly.time[index];
    if (timestamp === undefined) continue; // noUnchecked: index dizinin uzunlugu icerisinde; sadece tip guard'i
    const date = toDate(timestamp);
    const hour = Number(getHourFormatter(resolvedTimezone).format(date));
    const isNight = hour >= 19 || hour <= 5;
    const hasUsableWeather = (hourly.cloudCover[index] ?? 100) <= 15
      && (hourly.windspeed[index] ?? Number.POSITIVE_INFINITY) < 20;

    if (isNight && hasUsableWeather) currentSequence.push(index);
    else commitSequence();
  }
  commitSequence();

  if (!longestSequence.length) return null;
  const startIndex = longestSequence[0]; // boş değil — uzunluk guard'ı yukarıda
  const endIndex = longestSequence[longestSequence.length - 1];
  if (startIndex === undefined || endIndex === undefined) return null; // noUnchecked: sequence boş değil; sadece tip guard'i
  const avgWind = longestSequence.reduce((sum, index) => sum + (hourly.windspeed[index] ?? 0), 0)
    // windspeed tanimsiz ornekler yukaridaki hasUsableWeather (?? Infinity) sartinda elenmistir; ?? 0 imkansiz daldır.
    / longestSequence.length;

  const startTime = hourly.time[startIndex]; // startIndex < time.length garanti (sequence index'lerinden üretilir)
  const endTime = hourly.time[endIndex];
  if (startTime === undefined || endTime === undefined) return null; // noUnchecked: sadece tip guard'i

  return {
    start: formatGuideTime(toDate(startTime), timezone),
    end: formatGuideTime(toDate(endTime), timezone),
    avgWind,
  };
};
