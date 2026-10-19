import { describe, expect, it } from 'vitest';
import { buildSkyTimeline } from './observationTimeline';

describe('buildSkyTimeline', () => {
  it('creates stable hourly points and penalizes heavy cloud', () => {
    const now = new Date('2026-07-13T20:00:00.000Z');
    const target = {
      id: 'saturn', equipment: ['telescope' as const], bestTime: now, altitude: 45, direction: 'S', score: 80,
      visibility: 'excellent' as const,
      altitudePoints: [{ time: now, altitude: 45 }, { time: new Date(now.getTime() + 3_600_000), altitude: 50 }],
    };
    const clear = buildSkyTimeline(now, 40, 29, null, 0, [target], 2);
    const cloudy = buildSkyTimeline(now, 40, 29, null, 100, [target], 2);
    expect(clear).toHaveLength(2);
    expect(clear[0]?.time).toBeInstanceOf(Date);
    expect(clear[0]?.score).toBeGreaterThan(cloudy[0]!.score);
  });
});
