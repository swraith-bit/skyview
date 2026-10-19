import { Capacitor, registerPlugin } from '@capacitor/core';

export interface RichAlertOptions {
  id: number;
  triggerAtMs: number;
  title: string;
  body: string;
  timeLabel: string;
  durationSeconds: number;
  route: string;
  exact: boolean;
}

interface SkyNotifyPlugin {
  scheduleIssPass(options: RichAlertOptions): Promise<{ scheduled: boolean; exact: boolean }>;
  scheduleMeteorPeak(options: RichAlertOptions): Promise<{ scheduled: boolean; exact: boolean }>;
  cancelEvent(options: { id: number }): Promise<void>;
}

const SkyNotify = registerPlugin<SkyNotifyPlugin>('SkyNotify');

const scheduleRichAlert = async (
  kind: 'iss' | 'meteor',
  options: RichAlertOptions,
): Promise<'exact' | 'inexact' | false> => {
  if (Capacitor.getPlatform() !== 'android') return false;
  try {
    const result = kind === 'iss'
      ? await SkyNotify.scheduleIssPass(options)
      : await SkyNotify.scheduleMeteorPeak(options);
    if (!result.scheduled) return false;
    return result.exact ? 'exact' : 'inexact';
  } catch (error) {
    console.warn(`Rich ${kind} notification could not be scheduled.`, error);
    return false;
  }
};

/**
 * TUR 2 / Faz 6.3 — ISS geçişi için mini yörünge grafikli bildirim.
 * Native eklenti yoksa/başarısızsa `false` döner; çağıran temel
 * LocalNotifications yoluna düşer.
 */
export const scheduleRichIssPass = (options: RichAlertOptions) => scheduleRichAlert('iss', options);

/** TUR 2 / Faz 6.3 — Meteor zirvesi için akanyıldız grafikli bildirim. */
export const scheduleRichMeteorPeak = (options: RichAlertOptions) => scheduleRichAlert('meteor', options);

/** İki bildirim türü de aynı alarm kimliği uzayını kullanır. */
export const cancelRichEvent = async (id: number): Promise<void> => {
  if (Capacitor.getPlatform() !== 'android') return;
  try {
    await SkyNotify.cancelEvent({ id });
  } catch (error) {
    console.warn('Rich alert could not be cancelled.', error);
  }
};
