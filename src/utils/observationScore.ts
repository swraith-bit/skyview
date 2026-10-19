export type ObservationProfile = 'general' | 'planetary' | 'deepSky' | 'meteor';
export type ScoreFactor = 'cloud' | 'moon' | 'darkness' | 'targets' | 'wind' | 'humidity';
export type ForecastConfidence = 'high' | 'medium' | 'low';

export interface ScoreInputs {
  cloudCover: number;
  windSpeed: number;
  humidity: number;
  bortleIndex: number;
  moonIllumination: number;
  visiblePlanetsCount: number;
  /** F4.1: false → factor is neutral (50) instead of treating 0 km/h as a perfect calm. */
  windKnown?: boolean;
  /** F4.1: false → factor is neutral (50) instead of assuming a stored placeholder. */
  humidityKnown?: boolean;
}

export interface ScoreComponent {
  factor: ScoreFactor;
  value: number;
  weight: number;
  contribution: number;
}

export interface ProfileScore {
  profile: ObservationProfile;
  score: number;
  components: ScoreComponent[];
}

export interface ObservationScoreReport {
  profiles: Record<ObservationProfile, ProfileScore>;
  confidence: ForecastConfidence;
  confidenceScore: number;
}

export interface ForecastContext {
  fetchedAt?: number;
  offline?: boolean;
  hasHourlyData?: boolean;
  bortleEstimated?: boolean;
}

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

const PROFILE_WEIGHTS: Record<ObservationProfile, Record<ScoreFactor, number>> = {
  general: { cloud: 0.40, moon: 0.25, darkness: 0.15, targets: 0.10, wind: 0.05, humidity: 0.05 },
  planetary: { cloud: 0.45, moon: 0.05, darkness: 0.05, targets: 0.25, wind: 0.15, humidity: 0.05 },
  deepSky: { cloud: 0.35, moon: 0.25, darkness: 0.25, targets: 0.05, wind: 0.05, humidity: 0.05 },
  meteor: { cloud: 0.45, moon: 0.25, darkness: 0.20, targets: 0, wind: 0.03, humidity: 0.07 },
};

const factorValues = ({
  cloudCover,
  windSpeed,
  humidity,
  bortleIndex,
  moonIllumination,
  visiblePlanetsCount,
  windKnown = true,
  humidityKnown = true,
}: ScoreInputs): Record<ScoreFactor, number> => ({
  cloud: 100 - clamp(cloudCover),
  moon: 100 - clamp(moonIllumination * 100),
  darkness: 100 - clamp((clamp(bortleIndex, 1, 9) - 1) * 12.5),
  targets: Math.min(100, visiblePlanetsCount * 25),
  // F4.1: unknown weather readings stay neutral (50) — they must not masquerade
  // as perfect conditions (0 km/h wind used to inflate the score).
  wind: windKnown ? 100 - clamp(Math.max(0, windSpeed - 5) * 4) : 50,
  humidity: humidityKnown ? 100 - clamp(Math.max(0, humidity - 45) * 1.8) : 50,
});

export const calculateProfileScore = (
  inputs: ScoreInputs,
  profile: ObservationProfile,
): ProfileScore => {
  const values = factorValues(inputs);
  const weights = PROFILE_WEIGHTS[profile];
  const components = (Object.keys(weights) as ScoreFactor[])
    .filter(factor => weights[factor] > 0)
    .map(factor => ({
      factor,
      value: Math.round(values[factor]),
      weight: weights[factor],
      contribution: Math.round(values[factor] * weights[factor] * 10) / 10,
    }));
  return {
    profile,
    score: Math.round(clamp(components.reduce((sum, component) => sum + component.contribution, 0))),
    components,
  };
};

export const calculateForecastConfidence = ({
  fetchedAt,
  offline = false,
  hasHourlyData = true,
  bortleEstimated = true,
}: ForecastContext): { level: ForecastConfidence; score: number } => {
  let score = 100;
  if (!fetchedAt) score -= 20;
  else {
    const ageMinutes = Math.max(0, (Date.now() - fetchedAt) / 60_000);
    if (ageMinutes > 360) score -= 35;
    else if (ageMinutes > 180) score -= 25;
    else if (ageMinutes > 60) score -= 12;
  }
  if (offline) score -= 30;
  if (!hasHourlyData) score -= 20;
  if (bortleEstimated) score -= 10;
  const normalized = Math.round(clamp(score));
  return {
    score: normalized,
    level: normalized >= 75 ? 'high' : normalized >= 50 ? 'medium' : 'low',
  };
};

export const buildObservationScoreReport = (
  inputs: ScoreInputs,
  context: ForecastContext = {},
): ObservationScoreReport => {
  const confidence = calculateForecastConfidence(context);
  return {
    profiles: {
      general: calculateProfileScore(inputs, 'general'),
      planetary: calculateProfileScore(inputs, 'planetary'),
      deepSky: calculateProfileScore(inputs, 'deepSky'),
      meteor: calculateProfileScore(inputs, 'meteor'),
    },
    confidence: confidence.level,
    confidenceScore: confidence.score,
  };
};

export const calculateObservationScore = (inputs: ScoreInputs): number =>
  calculateProfileScore(inputs, 'general').score;

export const calculateHourlyConditionScore = (
  cloudCover: number,
  windSpeed: number,
): number =>
  clamp((100 - clamp(cloudCover)) * 0.8 + (100 - clamp(Math.max(0, windSpeed - 5) * 4)) * 0.2);
