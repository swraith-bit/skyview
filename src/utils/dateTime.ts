export const getHourInTimeZone = (date: Date, timeZone?: string): number => {
  if (!timeZone) return date.getHours();
  try {
    const value = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      hourCycle: 'h23',
      timeZone,
    }).format(date);
    return Number(value);
  } catch {
    return date.getHours();
  }
};

export interface LocalDateParts {
  year: number;
  month: number;
  day: number;
}

export interface LocalDateTimeParts extends LocalDateParts {
  hour: number;
  minute: number;
}

export const getLocalDateParts = (date: Date, timeZone?: string): LocalDateParts => {
  if (!timeZone) {
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
    };
  }
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone,
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return {
      year: Number(values.year),
      month: Number(values.month) - 1,
      day: Number(values.day),
    };
  } catch {
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
    };
  }
};

export const getTimePartsInTimeZone = (date: Date, timeZone?: string): LocalDateTimeParts => {
  if (!timeZone) {
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
    };
  }
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone,
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return {
      year: Number(values.year),
      month: Number(values.month) - 1,
      day: Number(values.day),
      hour: Number(values.hour) % 24,
      minute: Number(values.minute),
    };
  } catch {
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
    };
  }
};

export const makeInstantForTimeZone = (
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  timeZone?: string,
  minute = 0,
): Date => {
  if (!timeZone) return new Date(year, monthIndex, day, hour, minute, 0, 0);

  let instant = new Date(Date.UTC(year, monthIndex, day, hour, minute, 0, 0));
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
        timeZone,
      }).formatToParts(instant);
      const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
      const representedAsUtc = Date.UTC(
        Number(values.year),
        Number(values.month) - 1,
        Number(values.day),
        Number(values.hour) % 24,
        Number(values.minute),
        Number(values.second),
      );
      const desiredAsUtc = Date.UTC(year, monthIndex, day, hour, minute, 0);
      instant = new Date(instant.getTime() + (desiredAsUtc - representedAsUtc));
    } catch {
      return new Date(year, monthIndex, day, hour, minute, 0, 0);
    }
  }
  return instant;
};

export const getLocalDayDiff = (from: Date, to: Date, timeZone?: string): number => {
  const start = getLocalDateParts(from, timeZone);
  const end = getLocalDateParts(to, timeZone);
  const startUtc = Date.UTC(start.year, start.month, start.day);
  const endUtc = Date.UTC(end.year, end.month, end.day);
  return Math.round((endUtc - startUtc) / 86_400_000);
};

export const formatTimeInTimeZone = (
  date: Date,
  locale: string,
  timeZone?: string,
): string => date.toLocaleTimeString(locale, {
  hour: '2-digit',
  minute: '2-digit',
  ...(timeZone ? { timeZone } : {}),
});

export const getDateKeyInTimeZone = (date: Date, timeZone?: string): string => {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...(timeZone ? { timeZone } : {}),
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
};

export interface CountdownUnits {
  days: string;
  hours: string;
  minutes: string;
}

/**
 * F6.10 — zirveye kalan süre metni (saf, worker-safe): dakika-tanesine kadar
 * insani biçim. `now` üstüne hedef geçmişse null döner (çağıran hero'yu gizler).
 * Dakika-tanımlıdır: çağıranlar `observer.instant` (dakikalık tick) ile
 * yeniden-render ettiği için saniye-tikleyicisi hiçbir zaman gerekmez.
 */
export const formatCountdownToInstant = (
  now: Date,
  target: Date,
  units: CountdownUnits,
): string | null => {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 60) return `${totalMinutes} ${units.minutes}`;
  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 48) {
    const minutes = totalMinutes % 60;
    return minutes > 0
      ? `${totalHours} ${units.hours} ${minutes} ${units.minutes}`
      : `${totalHours} ${units.hours}`;
  }
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return hours > 0
    ? `${days} ${units.days} ${hours} ${units.hours}`
    : `${days} ${units.days}`;
};
