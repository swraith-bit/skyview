import { SmartNotificationPreferences } from '../types';
import { DEFAULT_KP_ALERT_THRESHOLD } from './kpThresholds';
import { appStorage } from '../repositories/storageRepository';

const NOTIFICATION_KEY = 'skyview_smart_notifications';
const HH_MM_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export const readStorageJson = <T>(key: string, fallback: T): T => {
  return appStorage.getJson(key, fallback);
};

export const writeStorageJson = <T>(key: string, value: T): boolean => {
  return appStorage.setJson(key, value);
};

export const defaultNotificationPreferences: SmartNotificationPreferences = {
  conditionAlerts: true,
  cloudThreshold: 30,
  auroraAlerts: true,
  kpThreshold: DEFAULT_KP_ALERT_THRESHOLD,
  issAlerts: true,
  eventAlerts: true,
  quietHoursEnabled: true,
  quietStart: '23:00',
  quietEnd: '08:00',
  eventLeadHours: 24,
  weatherSuitableOnly: false,
};

// Alan-bazlı "catch" terleyici — eski zod `NotificationPreferencesSchema.catch(default)`
// semantiği birebir korunur: geçersiz alan → alanın varsayılanı; bilinmeyen anahtarlar
// yazılmaz (zod object parser'ın strip davranışı). zod, ilk-yükleme grafından
// çıkarıldı (§6 zod ilk-yükleme optimizasyonu — ROADMAP 13. oturum notu).
const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sanitizeNotificationPreferences = (
  candidate: Record<string, unknown>,
): SmartNotificationPreferences => {
  const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
  const isHhMm = (value: unknown): value is string => typeof value === 'string' && HH_MM_REGEX.test(value);
  const bounded = (value: unknown, min: number, max: number): number | null => (
    typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : null
  );

  return {
    conditionAlerts: isBoolean(candidate.conditionAlerts)
      ? candidate.conditionAlerts
      : defaultNotificationPreferences.conditionAlerts,
    cloudThreshold: bounded(candidate.cloudThreshold, 0, 100)
      ?? defaultNotificationPreferences.cloudThreshold,
    auroraAlerts: isBoolean(candidate.auroraAlerts)
      ? candidate.auroraAlerts
      : defaultNotificationPreferences.auroraAlerts,
    kpThreshold: bounded(candidate.kpThreshold, 0, 9)
      ?? defaultNotificationPreferences.kpThreshold,
    issAlerts: isBoolean(candidate.issAlerts)
      ? candidate.issAlerts
      : defaultNotificationPreferences.issAlerts,
    eventAlerts: isBoolean(candidate.eventAlerts)
      ? candidate.eventAlerts
      : defaultNotificationPreferences.eventAlerts,
    quietHoursEnabled: isBoolean(candidate.quietHoursEnabled)
      ? candidate.quietHoursEnabled
      : defaultNotificationPreferences.quietHoursEnabled,
    quietStart: isHhMm(candidate.quietStart)
      ? candidate.quietStart
      : defaultNotificationPreferences.quietStart,
    quietEnd: isHhMm(candidate.quietEnd)
      ? candidate.quietEnd
      : defaultNotificationPreferences.quietEnd,
    eventLeadHours: bounded(candidate.eventLeadHours, 0, 168)
      ?? defaultNotificationPreferences.eventLeadHours,
    weatherSuitableOnly: isBoolean(candidate.weatherSuitableOnly)
      ? candidate.weatherSuitableOnly
      : defaultNotificationPreferences.weatherSuitableOnly,
  };
};

export const getNotificationPreferences = (): SmartNotificationPreferences => {
  const stored = readStorageJson<unknown>(NOTIFICATION_KEY, {});
  const candidate = isPlainRecord(stored) ? stored : {};
  return sanitizeNotificationPreferences(candidate);
};

export const saveNotificationPreferences = (
  preferences: SmartNotificationPreferences,
): boolean => {
  // Spread-literal: interface'in örtük index-signature'ı yoktur; literal genişletme
  // Record<string, unknown> parametresiyle atanabilir kalır (alanlar korunur).
  const safePrefs = sanitizeNotificationPreferences({ ...preferences });
  return writeStorageJson(NOTIFICATION_KEY, safePrefs);
};
