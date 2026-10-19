export interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  state?: string;
  timezone?: string;
}

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  timezone?: string;
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
}

export type SuitabilityStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'unsuitable';
export type Tab = 'today' | 'sky' | 'plan' | 'settings';
export type AppRoute = 'today' | 'sky' | 'sky:targets' | 'sky:ar' | 'sky:iss' | 'sky:satellites' | 'sky:apod' | 'plan' | 'plan:meteor' | 'settings' | 'settings:notifications';

export interface HourlyData {
  time: number[] | string[];
  cloudCover: number[];
  windspeed: number[];
}

export interface ObservationData {
  cloudCover: number;
  temp: number;
  windSpeed: number;
  humidity: number;
  suitability: SuitabilityStatus;
  statusText: string;
  colorTheme: 'green' | 'red';
  hourly: HourlyData;
  bortleIndex: number;
}

export interface MoonPhaseInfo {
  date: Date;
  age: number;
  phaseName: string;
  phaseType: string;
  fraction: number;
  isWaxing: boolean;
}

export interface YearlyMoonEvent {
  date: Date;
  phaseType: 'full-moon' | 'new-moon';
  phaseName: string;
}

export interface AstroEvent {
  date: Date;
  title: string;
  description: string;
  type: 'meteor' | 'eclipse' | 'planet';
}

export type EquipmentKind = 'naked-eye' | 'binoculars' | 'telescope' | 'camera';

export interface SmartNotificationPreferences {
  conditionAlerts: boolean;
  cloudThreshold: number;
  auroraAlerts: boolean;
  kpThreshold: number;
  issAlerts: boolean;
  eventAlerts: boolean;
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  eventLeadHours: number;
  weatherSuitableOnly: boolean;
}

export interface DarknessWindow {
  start: Date;
  end: Date;
  durationMinutes: number;
  averageCloudCover: number;
  moonIllumination: number;
  moonBelowHorizon: boolean;
}

export interface TonightTarget {
  id: string;
  equipment: EquipmentKind[];
  bestTime: Date;
  altitude: number;
  direction: string;
  score: number;
  visibility: 'excellent' | 'good' | 'low';
  altitudePoints: Array<{ time: Date; altitude: number }>;
}

export interface ObservationPlanItem {
  id: string;
  targetId: string;
  targetName: string;
  plannedFor: string;
  createdAt: string;
  location: LocationData;
  completed: boolean;
}

export interface ObservationLogEntry {
  id: string;
  targetId: string;
  targetName: string;
  observedAt: string;
  createdAt: string;
  location: LocationData;
  note: string;
  rating: 1 | 2 | 3 | 4 | 5;
}

export interface SkyTimelinePoint {
  time: Date;
  score: number;
  cloudCover: number;
  sunAltitude: number;
  moonAltitude: number;
  moonIllumination: number;
  bestTargetId: string | null;
  bestTargetAltitude: number;
}
