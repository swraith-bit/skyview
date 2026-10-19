import { describe, expect, it } from 'vitest';
import { buildObservationScoreReport, calculateForecastConfidence, calculateHourlyConditionScore, calculateObservationScore } from './observationScore';

describe('observation scoring', () => {
  it('rewards clear, calm, dry and dark conditions', () => {
    const excellent = calculateObservationScore({
      cloudCover: 2,
      windSpeed: 4,
      humidity: 45,
      bortleIndex: 2,
      moonIllumination: 0,
      visiblePlanetsCount: 3,
    });
    const poor = calculateObservationScore({
      cloudCover: 90,
      windSpeed: 30,
      humidity: 95,
      bortleIndex: 9,
      moonIllumination: 1,
      visiblePlanetsCount: 0,
    });

    expect(excellent).toBeGreaterThan(85);
    expect(poor).toBeLessThan(15);
  });

  it('uses wind to break otherwise similar hourly forecasts', () => {
    expect(calculateHourlyConditionScore(20, 5))
      .toBeGreaterThan(calculateHourlyConditionScore(20, 30));
  });

  it('does not punish planetary observing as strongly for moonlight', () => {
    const report = buildObservationScoreReport({
      cloudCover: 5,
      windSpeed: 4,
      humidity: 45,
      bortleIndex: 5,
      moonIllumination: 1,
      visiblePlanetsCount: 3,
    }, { fetchedAt: Date.now(), hasHourlyData: true });

    expect(report.profiles.planetary.score).toBeGreaterThan(report.profiles.deepSky.score);
    expect(report.profiles.planetary.score).toBeGreaterThan(report.profiles.meteor.score);
  });

  it('lowers confidence for stale offline data', () => {
    const confidence = calculateForecastConfidence({
      fetchedAt: Date.now() - 8 * 60 * 60_000,
      offline: true,
      hasHourlyData: false,
      bortleEstimated: true,
    });
    expect(confidence.level).toBe('low');
    expect(confidence.score).toBeLessThan(50);
  });

  it('treats unknown wind as neutral, not as perfect calm (F4.1)', () => {
    const scoreCase = (windSpeedKnown: boolean | undefined, windSpeed: number) => calculateObservationScore({
      cloudCover: 30,
      windSpeed,
      humidity: 95,
      humidityKnown: false,
      bortleIndex: 5,
      moonIllumination: 0.2,
      visiblePlanetsCount: 2,
      windKnown: windSpeedKnown,
    });

    // Unknown wind used to fall back to 0 km/h → inflated (perfect calm) score.
    // Neutral (50) must sit strictly below a true calm and above a gale.
    const trueCalm = scoreCase(true, 4);
    const unknown = scoreCase(false, 40);
    const gale = scoreCase(true, 40);
    const withDefaultFlags = scoreCase(undefined, 40);

    expect(unknown).toBeLessThan(trueCalm);
    expect(unknown).toBeGreaterThan(gale);
    expect(withDefaultFlags).toBe(gale);
  });
});
