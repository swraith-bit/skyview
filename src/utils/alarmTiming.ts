/**
 * F4.4 shared alarm-trigger math.
 *
 * Both helpers keep the trigger strictly in the future: an alarm may shift
 * closer to the event, but it must never fire after it, and it must never be
 * scheduled in the past (which previously turned into a silent "could not
 * schedule" error for the ISS case).
 */

export const ALARM_MIN_DELAY_MS = 60_000;

/**
 * Meteor peak anchor: buildShowers() peaks at 12:00 local time of the peak
 * day, so anchoring on the peak instant itself (instead of the old fixed
 * 21:00 evening anchor) can no longer fire *after* the peak at short leads.
 * Returns the trigger instant, or null when the peak already elapsed.
 */
export const computeMeteorAlarmTrigger = (
  peak: Date,
  leadHours: number,
  nowMs: number,
): Date | null => {
  const peakMs = peak.getTime();
  if (!Number.isFinite(peakMs) || peakMs <= nowMs) return null;
  const leadMs = Math.max(0, leadHours) * 3_600_000;
  const ideal = peakMs - leadMs;
  if (ideal > nowMs) return new Date(ideal);
  // Lead longer than the remaining time: fire soon, but never after the peak.
  return new Date(Math.min(peakMs, nowMs + ALARM_MIN_DELAY_MS));
};

/**
 * ISS pass alarm: ideal trigger is `rise − lead` (15 min). When the rise is
 * closer than the lead, the old code produced a past timestamp → schedule
 * dropped it as an error. Instead we clamp to the rise itself (still useful —
 * the pass lasts several minutes) and only give up when the pass fully elapsed.
 */
export const computeIssAlarmTriggerMs = (
  riseMs: number,
  nowMs: number,
  leadMs = 15 * 60_000,
): number | null => {
  if (!Number.isFinite(riseMs)) return null;
  const ideal = riseMs - leadMs;
  if (ideal > nowMs) return ideal;
  if (riseMs > nowMs) return riseMs;
  return null;
};
