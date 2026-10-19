import { getHourInTimeZone, getLocalDateParts } from './dateTime';

/**
 * F4.1 helpers for the observation planner night windows.
 *
 * The planner used to assume exactly 24 hourly samples per local day
 * (`i * 24` indexing), which drifted on DST-transition days, truncated last
 * days, and produced `new Date(NaN)` on empty series. These helpers derive
 * every index from the actual unix timestamps instead.
 */

export const NIGHT_EVENING_HOUR = 20;
export const NIGHT_MORNING_HOUR = 4;

/** Groups hourly sample indices by their local calendar day key (`YYYY-MM-DD`). */
export const groupHourlyIndicesByLocalDay = (
  times: readonly number[],
  timeZone?: string,
): Map<string, number[]> => {
  const groups = new Map<string, number[]>();
  times.forEach((value, index) => {
    if (!Number.isFinite(value)) return;
    const date = new Date(value * 1000);
    if (Number.isNaN(date.getTime())) return;
    const dayKey = getLocalDateParts(date, timeZone);
    const key = `${dayKey.year}-${String(dayKey.month + 1).padStart(2, '0')}-${String(dayKey.day).padStart(2, '0')}`;
    const group = groups.get(key);
    if (group) group.push(index);
    else groups.set(key, [index]);
  });
  return groups;
};

/**
 * Night-hour indices for one local day: hours >= 20:00 on the target day plus
 * hours <= 04:00 on the following local day. Unknown (missing) groups simply
 * contribute zero hours instead of falling back to arbitrary indexing.
 */
export const nightWindowIndicesForDay = (
  times: readonly number[],
  dayGroup: readonly number[] | undefined,
  nextDayGroup: readonly number[] | undefined,
  timeZone?: string,
): number[] => {
  const nightIndices: number[] = [];
  dayGroup?.forEach(index => {
    const time = times[index];
    if (time === undefined) return;
    const hour = getHourInTimeZone(new Date(time * 1000), timeZone);
    if (hour >= NIGHT_EVENING_HOUR) nightIndices.push(index);
  });
  nextDayGroup?.forEach(index => {
    const time = times[index];
    if (time === undefined) return;
    const hour = getHourInTimeZone(new Date(time * 1000), timeZone);
    if (hour <= NIGHT_MORNING_HOUR) nightIndices.push(index);
  });
  return nightIndices;
};

/**
 * Anchor sample for a night (moon phase / planet positions): the 21:00 local
 * hour when available, otherwise the first real sample of that day. Returns -1
 * when the day has no data points at all (never invents an index).
 */
export const findAnchorIndexForDay = (
  times: readonly number[],
  dayGroup: readonly number[] | undefined,
  timeZone?: string,
): number => {
  if (!dayGroup || dayGroup.length === 0) return -1;
  const eveningIndex = dayGroup.find(index => {
    const time = times[index];
    return time !== undefined && getHourInTimeZone(new Date(time * 1000), timeZone) === 21;
  });
  // dayGroup.length === 0 is guarded above, so dayGroup[0] always exists.
  return eveningIndex ?? dayGroup[0] ?? -1;
};

/** Keeps only samples strictly in the future (used for the "Tonight" averages). */
export const filterUpcomingIndices = (
  indices: readonly number[],
  times: readonly number[],
  nowMs: number,
): number[] => indices.filter(index => times[index] !== undefined && times[index] * 1000 > nowMs);
