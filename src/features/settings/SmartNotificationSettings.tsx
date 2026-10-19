import React, { useState } from 'react';
import { Bell, Cloud, Gauge, Satellite } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import { formatMessage } from '../../i18nExtra';
import { SmartNotificationPreferences } from '../../types';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from '../../utils/featureStorage';
import { KP_MODERATE_INDEX } from '../../utils/kpThresholds';
import { selectionHaptic } from '../../utils/haptics';
import {
  cancelAuroraNotifications,
  cancelClearSkyNotifications,
} from '../../utils/smartNotifications';
import {
  cancelIssNotifications,
  cancelMeteorNotifications,
} from '../../utils/scheduledAlertCleanup';
import { syncBackgroundAlerts } from '../../native/backgroundAlerts';

const Row: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ icon, title, description, checked, onChange }) => (
  <label className="min-h-16 rounded-lg border border-slate-700/60 bg-slate-900/45 p-4 flex items-center gap-3 cursor-pointer">
    <span className="text-indigo-400">{icon}</span>
    <span className="flex-1">
      <span className="block font-medium text-white">{title}</span>
      <span className="block text-sm text-slate-400">{description}</span>
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={event => onChange(event.target.checked)}
      className="w-5 h-5 accent-indigo-500"
    />
  </label>
);

const KP_THRESHOLD_OPTIONS = Array.from(
  { length: 9 - KP_MODERATE_INDEX + 1 },
  (_, offset) => KP_MODERATE_INDEX + offset,
);

export const SmartNotificationSettings: React.FC = () => {
  const { lang, currentLocation } = useAppStore();
  const [preferences, setPreferences] = useState<SmartNotificationPreferences>(getNotificationPreferences);
  const latestPreferencesRef = React.useRef<SmartNotificationPreferences>(preferences);
  // F6++: hız kaydırıcı sürekli onChange üretir; her olayda yazma kuyruğu + native
  // sync yerine son değeri kısa bir bekleme penceresiyle tek yönde commit edilir.
  const cloudCommitRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [message, setMessage] = useState('');

  React.useEffect(() => () => {
    // Montajdan çıkarken bekleyen zamanlayıcıyı iptal et ve son eşiği kaydet
    // (native sync App açılışında zaten yeniden kurar; kalıcılık burada garantilenir).
    if (cloudCommitRef.current !== null) {
      clearTimeout(cloudCommitRef.current);
      cloudCommitRef.current = null;
    }
    saveNotificationPreferences(latestPreferencesRef.current);
  }, []);

  const setCloudThreshold = (value: number) => {
    const next = { ...latestPreferencesRef.current, cloudThreshold: value };
    latestPreferencesRef.current = next;
    setPreferences(next);
    if (cloudCommitRef.current !== null) clearTimeout(cloudCommitRef.current);
    cloudCommitRef.current = setTimeout(() => {
      cloudCommitRef.current = null;
      void update('cloudThreshold', latestPreferencesRef.current.cloudThreshold);
    }, 350);
  };

  const update = async <K extends keyof SmartNotificationPreferences>(
    key: K,
    value: SmartNotificationPreferences[K],
  ) => {
    const next = { ...latestPreferencesRef.current, [key]: value };
    latestPreferencesRef.current = next;
    setPreferences(next);
    if (!saveNotificationPreferences(next)) {
      setMessage(t('notifications.saveError', lang));
      return;
    }

    try {
      await syncBackgroundAlerts(latestPreferencesRef.current, currentLocation, lang);
      if (key === 'conditionAlerts' && value === false) {
        await cancelClearSkyNotifications();
      }
      if (key === 'auroraAlerts' && value === false) {
        await cancelAuroraNotifications();
      }
      if (key === 'issAlerts' && value === false) {
        await cancelIssNotifications();
      }
      if (key === 'eventAlerts' && value === false) {
        await cancelMeteorNotifications();
      }
      setMessage('');
    } catch {
      setMessage(t('notifications.cancelError', lang));
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-400" />
          {t('notifications.title', lang)}
        </h2>
        <p className="text-sm text-slate-400">
          {t('notifications.description', lang)}
        </p>
      </div>
      <div className="space-y-3">
        <Row
          icon={<Cloud className="w-5 h-5" />}
          title={t('notifications.clearTitle', lang)}
          description={t('notifications.clearDesc', lang)}
          checked={preferences.conditionAlerts}
          onChange={value => { void update('conditionAlerts', value); }}
        />
        <Row
          icon={<Gauge className="w-5 h-5" />}
          title={t('notifications.auroraTitle', lang)}
          description={t('notifications.auroraDesc', lang)}
          checked={preferences.auroraAlerts}
          onChange={value => { void update('auroraAlerts', value); }}
        />
        <Row
          icon={<Satellite className="w-5 h-5" />}
          title="ISS"
          description={t('notifications.issDesc', lang)}
          checked={preferences.issAlerts}
          onChange={value => { void update('issAlerts', value); }}
        />
        <Row
          icon={<Gauge className="w-5 h-5" />}
          title={t('notifications.eventsTitle', lang)}
          description={t('notifications.eventsDesc', lang)}
          checked={preferences.eventAlerts}
          onChange={value => { void update('eventAlerts', value); }}
        />
      </div>
      <div className="border-t border-white/10 pt-5 space-y-4">
        <p className="text-sm font-medium text-slate-200">{t('notifications.thresholdsTitle', lang)}</p>
        <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="cloud-threshold" className="font-medium text-white">
              {t('notifications.cloudThresholdLabel', lang)}
            </label>
            <span className="text-sm font-medium text-indigo-300">
              {formatMessage(t('notifications.cloudThresholdValue', lang), { cloud: preferences.cloudThreshold })}
            </span>
          </div>
          <input
            id="cloud-threshold"
            type="range"
            min={0}
            max={100}
            step={5}
            value={preferences.cloudThreshold}
            onChange={event => setCloudThreshold(Number(event.target.value))}
            aria-describedby="cloud-threshold-desc"
            className="w-full min-h-11 accent-indigo-500"
          />
          <p id="cloud-threshold-desc" className="text-sm text-slate-400">
            {t('notifications.cloudThresholdDesc', lang)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 space-y-3">
          <div>
            <label htmlFor="kp-threshold" className="block font-medium text-white">
              {t('notifications.kpThresholdLabel', lang)}
            </label>
            <p className="text-sm text-slate-400">{t('notifications.kpThresholdDesc', lang)}</p>
          </div>
          <select
            id="kp-threshold"
            value={preferences.kpThreshold}
            onChange={event => {
              void selectionHaptic();
              void update('kpThreshold', Number(event.target.value));
            }}
            className="w-full min-h-12 rounded-lg border border-white/10 bg-slate-950 px-3 text-white"
          >
            {KP_THRESHOLD_OPTIONS.map(value => (
              <option key={value} value={value}>
                {formatMessage(t('notifications.kpValue', lang), { kp: value })}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block font-medium text-white">{t('notifications.quietHours', lang)}</span>
            <span className="block text-sm text-slate-400">{t('notifications.quietHoursDesc', lang)}</span>
          </span>
          <input
            type="checkbox"
            checked={preferences.quietHoursEnabled}
            onChange={event => { void update('quietHoursEnabled', event.target.checked); }}
            className="w-5 h-5 accent-indigo-500"
          />
        </label>
        {preferences.quietHoursEnabled && (
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-slate-400">
              {t('notifications.start', lang)}
              <input
                type="time"
                value={preferences.quietStart}
                onChange={event => { void update('quietStart', event.target.value); }}
                className="mt-1 w-full min-h-11 rounded-lg border border-white/10 bg-slate-950 px-3 text-white"
              />
            </label>
            <label className="text-sm text-slate-400">
              {t('notifications.end', lang)}
              <input
                type="time"
                value={preferences.quietEnd}
                onChange={event => { void update('quietEnd', event.target.value); }}
                className="mt-1 w-full min-h-11 rounded-lg border border-white/10 bg-slate-950 px-3 text-white"
              />
            </label>
          </div>
        )}
        <label className="block text-sm text-slate-400">
          {t('notifications.eventReminderTime', lang)}
          <select
            value={preferences.eventLeadHours}
            onChange={event => { void update('eventLeadHours', Number(event.target.value)); }}
            className="mt-1 w-full min-h-12 rounded-lg border border-white/10 bg-slate-950 px-3 text-white"
          >
            <option value={6}>{formatMessage(t('notifications.hoursBefore', lang), { hours: 6 })}</option>
            <option value={12}>{formatMessage(t('notifications.hoursBefore', lang), { hours: 12 })}</option>
            <option value={24}>{formatMessage(t('notifications.hoursBefore', lang), { hours: 24 })}</option>
            <option value={48}>{formatMessage(t('notifications.hoursBefore', lang), { hours: 48 })}</option>
          </select>
        </label>
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block font-medium text-white">{t('notifications.weatherSuitableOnly', lang)}</span>
            <span className="block text-sm text-slate-400">{t('notifications.weatherSuitableDesc', lang)}</span>
          </span>
          <input
            type="checkbox"
            checked={preferences.weatherSuitableOnly}
            onChange={event => { void update('weatherSuitableOnly', event.target.checked); }}
            className="w-5 h-5 accent-indigo-500"
          />
        </label>
      </div>
      {message && <p className="text-sm text-slate-300" role="status">{message}</p>}
    </section>
  );
};
