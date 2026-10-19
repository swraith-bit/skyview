import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { getNotificationPreferences } from './featureStorage';
import { AppRoute } from '../types';
import { getTimePartsInTimeZone, makeInstantForTimeZone } from './dateTime';

export type NotificationScheduleResult = 'exact' | 'inexact' | 'quiet' | false;

export const moveOutsideQuietHours = (date: Date, timeZone?: string): Date => {
  const preferences = getNotificationPreferences();
  if (!preferences.quietHoursEnabled) return date;
  const startParts = preferences.quietStart.split(':').map(Number);
  const endParts = preferences.quietEnd.split(':').map(Number);
  if (![...startParts, ...endParts].every(Number.isFinite)) return date;
  // The Number.isFinite guard above keeps these values finite; the defaults are unreachable type fallbacks.
  const [startHour = 0, startMinute = 0] = startParts;
  const [endHour = 0, endMinute = 0] = endParts;
  const parts = getTimePartsInTimeZone(date, timeZone);
  const minutes = parts.hour * 60 + parts.minute;
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  const inside = start > end ? minutes >= start || minutes < end : minutes >= start && minutes < end;
  if (!inside) return date;
  const dayOffset = start > end && minutes >= start ? 1 : 0;
  return makeInstantForTimeZone(parts.year, parts.month, parts.day + dayOffset, endHour, timeZone, endMinute);
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      return req.display === 'granted';
    }
    return true;
  } catch (err) {
    console.error('LocalNotifications permission request failed:', err);
    return false;
  }
};

export const ensureExactAlarmPermission = async (): Promise<boolean> => {
  if (Capacitor.getPlatform() !== 'android') return true;

  try {
    let status = await LocalNotifications.checkExactNotificationSetting();
    if (status.exact_alarm !== 'granted') {
      await LocalNotifications.changeExactNotificationSetting();
      status = await LocalNotifications.checkExactNotificationSetting();
    }
    return status.exact_alarm === 'granted';
  } catch (err) {
    console.error('Exact alarm setting check failed:', err);
    return false;
  }
};

export const scheduleNotification = async (
  id: number,
  title: string,
  body: string,
  triggerAt: Date,
  exact = false,
  route?: AppRoute,
  timeZone?: string,
): Promise<NotificationScheduleResult> => {
  if (!Capacitor.isNativePlatform()) return false;

  try {
      const scheduledAt = moveOutsideQuietHours(triggerAt, timeZone);
      // Check if trigger time is in the future
      if (scheduledAt.getTime() <= Date.now()) {
        return false;
      }
      // F4.4: silent-hours progress must be visible to the caller — the alarm can
      // move hours later and land after its event, so callers should not report
      // it as a plain on-time success.
      const shifted = scheduledAt.getTime() !== triggerAt.getTime();
      
      // First make sure we have permissions
      const hasPerm = await requestNotificationPermission();
      if (!hasPerm) return false;
      let useExactSchedule = exact;
      if (useExactSchedule) {
        const hasExactAlarm = await ensureExactAlarmPermission();
        useExactSchedule = hasExactAlarm;
      }

      // Cancel any existing notification with the same ID first
      await cancelNotification(id);

      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            schedule: { at: scheduledAt, allowWhileIdle: useExactSchedule },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: route ? { route } : null
          }
        ]
      });
      return shifted ? 'quiet' : (useExactSchedule ? 'exact' : 'inexact');
  } catch (err) {
    console.error('LocalNotifications schedule failed:', err);
    return false;
  }
};

export const cancelNotification = async (id: number): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;

  try {
      await LocalNotifications.cancel({
        notifications: [{ id }]
      });
      return true;
  } catch (err) {
    console.error('LocalNotifications cancel failed:', err);
    return false;
  }
};
