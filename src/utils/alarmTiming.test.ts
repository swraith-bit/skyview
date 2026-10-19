import { describe, expect, it } from 'vitest';
import {
  ALARM_MIN_DELAY_MS,
  computeIssAlarmTriggerMs,
  computeMeteorAlarmTrigger,
} from './alarmTiming';

const NOW = 1_800_000_000_000;

describe('computeMeteorAlarmTrigger', () => {
  it('schedules the full lead before the 12:00 local peak', () => {
    const peak = new Date(NOW + 48 * 3_600_000);
    const trigger = computeMeteorAlarmTrigger(peak, 24, NOW);

    expect(trigger?.getTime()).toBe(peak.getTime() - 24 * 3_600_000);
  });

  it('fires before the peak when the lead exceeds the remaining time', () => {
    const peak = new Date(NOW + 30 * 60_000);
    const trigger = computeMeteorAlarmTrigger(peak, 24, NOW);

    expect(trigger).not.toBeNull();
    expect(trigger!.getTime()).toBeGreaterThan(NOW);
    // never after the peak — the old 21:00 anchor fired 21 h after a 12:00 peak
    expect(trigger!.getTime()).toBeLessThanOrEqual(peak.getTime());
  });

  it('clamps a short lead to the standard minimum delay', () => {
    const peak = new Date(NOW + 5 * 60_000);
    const trigger = computeMeteorAlarmTrigger(peak, 0.1, NOW); // 6 min lead > remaining 5 min

    expect(trigger!.getTime()).toBe(NOW + ALARM_MIN_DELAY_MS);
    expect(trigger!.getTime()).toBeLessThanOrEqual(peak.getTime());
  });

  it('returns null once the peak has elapsed', () => {
    const peak = new Date(NOW - 3_600_000);

    expect(computeMeteorAlarmTrigger(peak, 6, NOW)).toBeNull();
  });
});

describe('computeIssAlarmTriggerMs', () => {
  it('uses the ideal rise − 15 min trigger while it is still in the future', () => {
    const rise = NOW + 90 * 60_000;

    expect(computeIssAlarmTriggerMs(rise, NOW)).toBe(rise - 15 * 60_000);
  });

  it('falls back to the rise itself when the rise is closer than the lead', () => {
    const rise = NOW + 5 * 60_000;

    expect(computeIssAlarmTriggerMs(rise, NOW)).toBe(rise);
  });

  it('gives up only after the pass has fully elapsed', () => {
    expect(computeIssAlarmTriggerMs(NOW - 60_000, NOW)).toBeNull();
    expect(computeIssAlarmTriggerMs(Number.NaN, NOW)).toBeNull();
  });
});
