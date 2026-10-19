import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ObservationData } from '../types';
import { defaultNotificationPreferences, saveNotificationPreferences } from './featureStorage';
import {
  AURORA_NOTIFICATION_ID,
  CLEAR_SKY_NOTIFICATION_ID,
  evaluateSmartNotifications,
} from './smartNotifications';

const notificationMocks = vi.hoisted(() => ({
  scheduleNotification: vi.fn(async () => true),
  cancelNotification: vi.fn(async () => true),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true,
  },
}));

vi.mock('./notifications', () => notificationMocks);

vi.mock('../services/kpService', () => ({
  fetchLatestKp: vi.fn(async () => null),
}));

class MemoryStorage {
  private values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const createObservation = (): ObservationData => ({
  suitability: 'excellent',
  statusText: 'Excellent',
  cloudCover: 12,
  temp: 18,
  humidity: 40,
  windSpeed: 5,
  bortleIndex: 4,
  colorTheme: 'green',
  hourly: {
    time: [Math.floor((Date.now() + 60 * 60_000) / 1000)],
    cloudCover: [10],
    windspeed: [5],
  },
});

describe('smart notifications', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
    vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
    notificationMocks.scheduleNotification.mockClear();
    notificationMocks.cancelNotification.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('cancels existing clear-sky notifications when condition alerts are disabled', async () => {
    storage.setItem('skyview_clear_sky_alert_2026-06-28', '1');
    saveNotificationPreferences({
      ...defaultNotificationPreferences,
      conditionAlerts: false,
      auroraAlerts: false,
    });

    await evaluateSmartNotifications(createObservation(), 'tr', 'UTC');

    expect(notificationMocks.cancelNotification).toHaveBeenCalledWith(CLEAR_SKY_NOTIFICATION_ID);
    expect(storage.getItem('skyview_clear_sky_alert_2026-06-28')).toBeNull();
    expect(notificationMocks.scheduleNotification).not.toHaveBeenCalled();
  });

  it('schedules clear-sky notifications with the clear-sky notification id when enabled', async () => {
    saveNotificationPreferences({
      ...defaultNotificationPreferences,
      conditionAlerts: true,
      auroraAlerts: false,
    });

    await evaluateSmartNotifications(createObservation(), 'tr', 'UTC');

    expect(notificationMocks.scheduleNotification).toHaveBeenCalledWith(
      CLEAR_SKY_NOTIFICATION_ID,
      'Gökyüzü açılıyor',
      'Bulut örtüsünün %10 olması bekleniyor.',
      expect.any(Date),
      false,
      'today',
      'UTC',
    );
    expect(notificationMocks.cancelNotification).toHaveBeenCalledWith(AURORA_NOTIFICATION_ID);
  });

  it('cancels a stale clear-sky notification when the refreshed forecast has no suitable window', async () => {
    saveNotificationPreferences({
      ...defaultNotificationPreferences,
      conditionAlerts: true,
      auroraAlerts: false,
    });
    const observation = createObservation();
    observation.cloudCover = 90;
    observation.hourly.cloudCover = [90];

    await evaluateSmartNotifications(observation, 'tr', 'UTC', '41.0000,29.0000');

    expect(notificationMocks.cancelNotification).toHaveBeenCalledWith(CLEAR_SKY_NOTIFICATION_ID);
    expect(notificationMocks.scheduleNotification).not.toHaveBeenCalled();
  });

  it('reconciles the scheduled alert after the active location changes', async () => {
    saveNotificationPreferences({
      ...defaultNotificationPreferences,
      conditionAlerts: true,
      auroraAlerts: false,
    });

    await evaluateSmartNotifications(createObservation(), 'tr', 'UTC', '41.0000,29.0000');
    await evaluateSmartNotifications(createObservation(), 'tr', 'UTC', '35.0000,139.0000');

    expect(notificationMocks.scheduleNotification).toHaveBeenCalledTimes(2);
  });

  it('keeps a single clear-sky push per day even as the trigger instant drifts (F4.4)', async () => {
    saveNotificationPreferences({
      ...defaultNotificationPreferences,
      conditionAlerts: true,
      auroraAlerts: false,
    });

    await evaluateSmartNotifications(createObservation(), 'tr', 'UTC', '41.0000,29.0000');
    await evaluateSmartNotifications(createObservation(), 'tr', 'UTC', '41.0000,29.0000');
    await evaluateSmartNotifications(createObservation(), 'tr', 'UTC', '41.0000,29.0000');

    expect(notificationMocks.scheduleNotification).toHaveBeenCalledTimes(1);
  });

  it("replaces today's push when the cloud forecast improves by more than 5 points", async () => {
    saveNotificationPreferences({
      ...defaultNotificationPreferences,
      conditionAlerts: true,
      auroraAlerts: false,
    });

    await evaluateSmartNotifications(createObservation(), 'tr', 'UTC', '41.0000,29.0000');
    const improved = createObservation();
    improved.hourly.cloudCover = [4];
    await evaluateSmartNotifications(improved, 'tr', 'UTC', '41.0000,29.0000');

    expect(notificationMocks.scheduleNotification).toHaveBeenCalledTimes(2);
  });
});
