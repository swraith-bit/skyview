import { Capacitor, registerPlugin } from '@capacitor/core';
import { LangCode } from '../i18n';
import { LocationData, SmartNotificationPreferences } from '../types';

interface BackgroundAlertOptions extends SmartNotificationPreferences {
  latitude: string;
  longitude: string;
  timezone: string;
  clearTitle: string;
  clearBody: string;
  auroraTitle: string;
  auroraBody: string;
}

interface SkyBackgroundPlugin {
  configure(options: BackgroundAlertOptions): Promise<void>;
}

const SkyBackground = registerPlugin<SkyBackgroundPlugin>('SkyBackground');

const labels: Record<LangCode, Pick<BackgroundAlertOptions, 'clearTitle' | 'clearBody' | 'auroraTitle' | 'auroraBody'>> = {
  tr: { clearTitle: 'Gökyüzü açılıyor', clearBody: 'Bulut örtüsü: {value}%.', auroraTitle: 'Aurora aktivitesi yükseldi', auroraBody: 'Güncel Kp indeksi: {value}.' },
  en: { clearTitle: 'The sky is clearing', clearBody: 'Cloud cover: {value}%.', auroraTitle: 'Aurora activity increased', auroraBody: 'Current Kp index: {value}.' },
  de: { clearTitle: 'Der Himmel klart auf', clearBody: 'Wolkenbedeckung: {value}%.', auroraTitle: 'Aurora-Aktivität gestiegen', auroraBody: 'Aktueller Kp-Index: {value}.' },
  fr: { clearTitle: 'Le ciel se dégage', clearBody: 'Couverture nuageuse : {value} %.', auroraTitle: "L'activité aurorale augmente", auroraBody: 'Indice Kp actuel : {value}.' },
  es: { clearTitle: 'El cielo se está despejando', clearBody: 'Nubosidad: {value}%.', auroraTitle: 'Aumentó la actividad de auroras', auroraBody: 'Índice Kp actual: {value}.' },
  ar: { clearTitle: 'السماء صافية', clearBody: 'الغطاء السحابي: {value}٪.', auroraTitle: 'ارتفاع نشاط الشفق', auroraBody: 'مؤشر Kp الحالي: {value}.' },
  it: { clearTitle: 'Il cielo si sta schiarendo', clearBody: 'Copertura nuvolosa: {value}%.', auroraTitle: "L'attività aurorale è aumentata", auroraBody: 'Indice Kp attuale: {value}.' },
  pt: { clearTitle: 'O céu está abrindo', clearBody: 'Cobertura de nuvens: {value}%.', auroraTitle: 'A atividade da aurora aumentou', auroraBody: 'Índice Kp atual: {value}.' },
};

export const syncBackgroundAlerts = async (
  preferences: SmartNotificationPreferences,
  location: LocationData,
  lang: LangCode,
): Promise<void> => {
  if (Capacitor.getPlatform() !== 'android') return;
  await SkyBackground.configure({
    ...preferences,
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    timezone: location.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    ...labels[lang],
  });
};
