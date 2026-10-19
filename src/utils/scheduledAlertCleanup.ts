import { cancelNotification } from './notifications';
import { cancelRichEvent } from '../native/richNotifications';
import { appStorage } from '../repositories/storageRepository';

const removeStoredKeysWithPrefix = (prefix: string): string[] => {
  const keys = appStorage.keys(prefix);
  keys.forEach(key => appStorage.remove(key));
  return keys;
};

export const getMeteorAlarmId = (name: string): number => {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 2147483647;
};

export const getIssAlarmId = (riseTime: string): number | null => {
  const timestamp = new Date(riseTime).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return Math.floor(timestamp / 1000) % 2147483647;
};

export const cancelMeteorNotifications = async (): Promise<void> => {
  const keys = removeStoredKeysWithPrefix('meteor_alarm_');
  const ids = keys.map(key => getMeteorAlarmId(key.slice('meteor_alarm_'.length)));
  await Promise.all(ids.flatMap(id => [cancelNotification(id), cancelRichEvent(id)]));
};

export const cancelIssNotifications = async (): Promise<void> => {
  const keys = removeStoredKeysWithPrefix('iss_alarm_');
  const notificationIds = keys
    .filter(key => key !== 'iss_alarm_time')
    .map(key => getIssAlarmId(key.slice('iss_alarm_'.length)))
    .filter((id): id is number => id !== null);
  // Faz 6.3: zengin ISS bildirimi AlarmManager üzerinden kurulur; LocalNotifications
  // iptali onu durdurmaz. İki kanalı birlikte temizle.
  await Promise.all(notificationIds.flatMap(id => [cancelNotification(id), cancelRichEvent(id)]));
};
