import { Capacitor } from '@capacitor/core';
import { LangCode, t } from '../i18n';
import { formatMessage } from '../i18nExtra';
import { ObservationData } from '../types';
import { getNotificationPreferences } from './featureStorage';
import { cancelNotification, scheduleNotification } from './notifications';
import { getDateKeyInTimeZone } from './dateTime';
import { fetchLatestKp } from '../services/kpService';
import { appStorage } from '../repositories/storageRepository';
import { AppRoute } from '../types';

export const CLEAR_SKY_NOTIFICATION_ID = 920001;
export const AURORA_NOTIFICATION_ID = 920002;
const removeStoredKeysWithPrefix = (prefix: string): void => {
  appStorage.keys(prefix).forEach(key => appStorage.remove(key));
};

export const cancelClearSkyNotifications = async (): Promise<void> => {
  removeStoredKeysWithPrefix('skyview_clear_sky_alert_');
  await cancelNotification(CLEAR_SKY_NOTIFICATION_ID);
};

export const cancelAuroraNotifications = async (): Promise<void> => {
  removeStoredKeysWithPrefix('skyview_kp_alert_');
  await cancelNotification(AURORA_NOTIFICATION_ID);
};

interface ClearSkyAlertMeta {
  triggerAt?: string;
  cloud?: number;
  locationKey?: string;
}

const readClearSkyAlertMeta = (key: string): ClearSkyAlertMeta | null => {
    const value = appStorage.getString(key);
    if (!value) return null;
    if (value === '1') return {};
    return appStorage.getJson<ClearSkyAlertMeta | null>(key, null);
};

const scheduleOnceToday = async (
  storageKey: string,
  id: number,
  title: string,
  body: string,
  timeZone?: string,
  route: AppRoute = 'today',
) => {
  const key = `${storageKey}_${getDateKeyInTimeZone(new Date(), timeZone)}`;
  if (appStorage.getString(key)) return;
  const triggerAt = new Date(Date.now() + 60_000);
  if (await scheduleNotification(id, title, body, triggerAt, false, route, timeZone)) {
    appStorage.setString(key, '1');
  }
};

export const evaluateSmartNotifications = async (
  observation: ObservationData,
  lang: LangCode,
  timeZone?: string,
  locationKey?: string,
): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  const preferences = getNotificationPreferences();

  if (preferences.conditionAlerts) {
    const suitableIndex = observation.hourly.cloudCover.findIndex((cloud, index) => {
      const value = observation.hourly.time[index];
      if (value === undefined) return false;
      const time = typeof value === 'number' ? value * 1000 : new Date(value).getTime();
      return cloud <= preferences.cloudThreshold && time > Date.now() + 5 * 60_000;
    });
    const upcomingValue = suitableIndex >= 0 ? observation.hourly.time[suitableIndex] : null;
    const upcomingTime = upcomingValue == null
      ? null
      : new Date(typeof upcomingValue === 'number' ? upcomingValue * 1000 : upcomingValue);
    const alertCloud = suitableIndex >= 0
      // findIndex above already matched this index in the same cloudCover array.
      ? observation.hourly.cloudCover[suitableIndex] ?? 0
      : observation.cloudCover;
    const triggerAt = observation.cloudCover <= preferences.cloudThreshold
      ? new Date(Date.now() + 60_000)
      : upcomingTime;

    if (triggerAt) {
      // F4.4: single-day / single-instant push model. The old trigger-instant
      // key plus a 30-minute drift window let each evaluation minute push the
      // notification +60 s again. Now one key per *today* — the window may only
      // be replaced when the location changed (fresh set) or the cloud
      // forecast improved by more than 5 points.
      const key = `skyview_clear_sky_alert_${getDateKeyInTimeZone(new Date(), timeZone)}`;
      const existing = readClearSkyAlertMeta(key);
      const existingLocation = existing?.locationKey ?? null;
      const existingCloud = typeof existing?.cloud === 'number' ? existing.cloud : null;
      const shouldSchedule =
        existing === null
        || (locationKey !== null && existingLocation !== null && existingLocation !== locationKey)
        || (existingCloud !== null && alertCloud < existingCloud - 5);

      if (shouldSchedule) {
        const title = t('notifications.clearSkyTitle', lang);
        const body = formatMessage(t('notifications.clearSkyBody', lang), { cloud: Math.round(alertCloud) });
        if (await scheduleNotification(CLEAR_SKY_NOTIFICATION_ID, title, body, triggerAt, false, 'today', timeZone)) {
          appStorage.setJson(key, {
            triggerAt: triggerAt.toISOString(),
            cloud: alertCloud,
            locationKey,
          });
        }
      }
    } else {
      // A newer forecast can invalidate an already scheduled clear-sky window.
      await cancelClearSkyNotifications();
    }
  } else {
    await cancelClearSkyNotifications();
  }

  if (!preferences.auroraAlerts) {
    await cancelAuroraNotifications();
    return;
  }

  try {
    const kp = await fetchLatestKp();
    if (kp !== null && kp >= preferences.kpThreshold) {
      await scheduleOnceToday(
        'skyview_kp_alert',
        AURORA_NOTIFICATION_ID,
        t('notifications.kpTitle', lang),
        formatMessage(t('notifications.kpBody', lang), { kp: kp.toFixed(1) }),
        timeZone,
      );
    }
  } catch (error) {
    console.warn('Kp alert evaluation failed', error);
  }
};
