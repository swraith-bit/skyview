import React, { useState } from 'react';
import { LangCode, t } from '../../i18n';
import { Zap, ChevronDown, ChevronUp, Eye, MapPin, Calendar, Bell, BellOff, Timer } from 'lucide-react';
import { Shower, buildShowers, getShowerName } from '../../utils/showers';
import { formatCountdownToInstant, CountdownUnits } from '../../utils/dateTime';
import { scheduleNotification, cancelNotification, moveOutsideQuietHours } from '../../utils/notifications';
import { cancelRichEvent, scheduleRichMeteorPeak } from '../../native/richNotifications';
import { computeMeteorAlarmTrigger } from '../../utils/alarmTiming';
import { playBellTone } from '../../utils/webBell';
import { getMeteorAlarmId } from '../../utils/scheduledAlertCleanup';
import { Capacitor } from '@capacitor/core';
import { getNotificationPreferences } from '../../utils/featureStorage';
import { getLocalDateParts, getLocalDayDiff } from '../../utils/dateTime';
import { useAppStore } from '../../store/useAppStore';
import { showToast } from '../../store/toastStore';
import { useObserverContext } from '../../hooks/useObserverContext';
import { fetchWeather } from '../../services/weatherService';
import { appStorage } from '../../repositories/storageRepository';

const alarmFailureMessage: Record<LangCode, string> = {
  tr: 'Alarm kurulamadı.',
  en: 'Alarm could not be scheduled.',
  de: 'Alarm konnte nicht geplant werden.',
  fr: 'Impossible de planifier l’alarme.',
  es: 'No se pudo programar la alarma.',
  ar: 'تعذر جدولة المنبه.',
  it: 'Impossibile programmare la sveglia.',
  pt: 'Não foi possível agendar o alarme.',
};

const weatherNotReadyMessage: Record<LangCode, string> = {
  tr: 'Hava tahmini henüz güvenilir aralıkta değil. Zirve yaklaşınca tekrar dene.',
  en: 'The weather forecast is not in range yet. Try again closer to the peak.',
  de: 'Die Wettervorhersage ist noch nicht im verlässlichen Bereich. Bitte kurz vor dem Höhepunkt erneut versuchen.',
  fr: 'Les prévisions météo ne sont pas encore assez précises. Réessayez à l’approche du pic.',
  es: 'El pronóstico del tiempo aún no es fiable. Inténtalo más cerca del pico.',
  ar: 'توقعات الطقس ليست ضمن النطاق الموثوق بعد. حاول مرة أخرى عند اقتراب الذروة.',
  it: 'Le previsioni meteo non sono ancora affidabili. Riprova più vicino al picco.',
  pt: 'A previsão do tempo ainda não está no intervalo confiável. Tente mais perto do pico.',
};

const cloudTooHighMessage: Record<LangCode, string> = {
  tr: 'Bulut tahmini eşikten yüksek; alarm kurulmadı.',
  en: 'Cloud forecast is above your threshold; alarm was not set.',
  de: 'Die Bewölkungsvorhersage liegt über dem Grenzwert; Alarm nicht gestellt.',
  fr: 'La couverture nuageuse dépasse le seuil ; alarme non activée.',
  es: 'La previsión de nubes supera tu límite; la alarma no se activó.',
  ar: 'توقعات السحب أعلى من الحد المحدد؛ لم يتم ضبط المنبه.',
  it: 'La copertura nuvolosa prevista supera la soglia; sveglia non impostata.',
  pt: 'A previsão de nuvens está acima do limite; o alarme não foi definido.',
};

const weatherVerifyFailedMessage: Record<LangCode, string> = {
  tr: 'Hava tahmini doğrulanamadı; alarm kurulmadı.',
  en: 'Weather could not be verified; alarm was not set.',
  de: 'Wetter konnte nicht überprüft werden; Alarm nicht gestellt.',
  fr: 'Impossible de vérifier la météo ; alarme non activée.',
  es: 'No se pudo verificar el tiempo; la alarma no se activó.',
  ar: 'تعذر التحقق من الطقس؛ لم يتم ضبط المنبه.',
  it: 'Impossibile verificare il meteo; sveglia non impostata.',
  pt: 'Não foi possível verificar a meteorologia; o alarme não foi definido.',
};

export const MeteorShowers: React.FC = () => {
  const { lang, currentLocation } = useAppStore();
  const timeZone = currentLocation?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [expanded, setExpanded] = useState<number | null>(null);
  const observer = useObserverContext(currentLocation);
  const now = observer.instant;
  const year = getLocalDateParts(now, timeZone).year;
  const showers = buildShowers(year, timeZone);
  // F4.4: next-year preview — after the last peak of the year the "Upcoming"
  // list would go empty, so the first showers of the following year are shown.
  const nextYearShowers = buildShowers(year + 1, timeZone);

  const [alarms, setAlarms] = useState<Record<string, boolean>>(() => {
    const saved: Record<string, boolean> = {};
    showers.forEach(s => {
      saved[s.name] = appStorage.getString(`meteor_alarm_${s.name}`) === '1';
    });
    return saved;
  });
  // F6.2: eski inline toast state'i kalktı; mesajlar showToast kanalına akar.

  const toggleAlarm = async (showerName: string) => {
    const alarmKey = `meteor_alarm_${showerName}`;
    const wasSet = alarms[showerName];
    const showerDisplayName = getShowerName(showerName, lang);
    const alarmId = getMeteorAlarmId(showerName);
    const notificationPreferences = getNotificationPreferences();
    if (!notificationPreferences.eventAlerts) {
      showToast(t('events.notificationsDisabled', lang));
      return;
    }

    if (wasSet) {
      appStorage.remove(alarmKey);
      setAlarms(prev => ({ ...prev, [showerName]: false }));
      const removedMessages: Record<LangCode, string> = {
        tr: `${showerDisplayName} alarmı kaldırıldı.`,
        en: `${showerDisplayName} alarm removed.`,
        de: `Alarm für ${showerDisplayName} entfernt.`,
        fr: `Alarme pour ${showerDisplayName} supprimée.`,
        es: `Alarma para ${showerDisplayName} eliminada.`,
        ar: `تمت إزالة منبه ${showerDisplayName}.`,
        it: `Sveglia per ${showerDisplayName} rimossa.`,
        pt: `Alarme para ${showerDisplayName} removido.`,
      };
      showToast(removedMessages[lang] || removedMessages.en);
      if (Capacitor.isNativePlatform()) {
        await cancelNotification(alarmId);
        await cancelRichEvent(alarmId);
      }
      return;
    }

    // §3.4 (F4.4): the web toggle used to exit silently. Now the tap is
    // acknowledged with a short bell and a clear "mobile only" message.
    if (!Capacitor.isNativePlatform()) {
      playBellTone();
      showToast(t('alarm.webOnly', lang));
      return;
    }

    const showerObj = showers.find(s => s.name === showerName) ?? nextYearShowers.find(s => s.name === showerName);
    if (showerObj) {
      // F4.4: anchor on the actual peak instant (12:00 local) instead of the
      // fixed 21:00 evening anchor, which fired after the 12:00 peak as soon
      // as the lead was shorter than 9 hours.
      const triggerAt = computeMeteorAlarmTrigger(showerObj.peak, notificationPreferences.eventLeadHours, Date.now());
      if (!triggerAt) {
        showToast(alarmFailureMessage[lang] || alarmFailureMessage.en, { variant: 'danger' });
        return;
      }

      if (notificationPreferences.weatherSuitableOnly) {
        const hoursToPeak = (showerObj.peak.getTime() - Date.now()) / 3_600_000;
        if (hoursToPeak > 72) {
          showToast(weatherNotReadyMessage[lang] || weatherNotReadyMessage.en, { variant: 'warning' });
          return;
        }
        try {
          const forecast = await fetchWeather(currentLocation);
          if (forecast.cloudCover > notificationPreferences.cloudThreshold) {
            showToast(cloudTooHighMessage[lang] || cloudTooHighMessage.en, { variant: 'warning' });
            return;
          }
        } catch {
          showToast(weatherVerifyFailedMessage[lang] || weatherVerifyFailedMessage.en, { variant: 'warning' });
          return;
        }
      }

      const titleMessages: Record<LangCode, string> = {
        tr: `${showerDisplayName} Meteor Yağmuru Zirvesi!`,
        en: `${showerDisplayName} Shower Peak!`,
        de: `${showerDisplayName}-Meteorschauer-Höhepunkt!`,
        fr: `Pic de l’essaim de météores ${showerDisplayName} !`,
        es: `¡Pico de la lluvia de meteoros ${showerDisplayName}!`,
        ar: `ذروة زخة شهب ${showerDisplayName}!`,
        it: `Picco dello sciame meteorico ${showerDisplayName}!`,
        pt: `Pico da chuva de meteoros ${showerDisplayName}!`,
      };
      const title = titleMessages[lang] || titleMessages.en;

      const bodyMessages: Record<LangCode, string> = {
        tr: `Bu gece gökyüzünü izlemeyi unutmayın! Maksimum saatlik meteor sayısı: ${showerObj.zhr}.`,
        en: `Do not forget to watch the sky tonight! Max meteors per hour: ${showerObj.zhr}.`,
        de: `Vergessen Sie nicht, heute Nacht den Himmel zu beobachten! Max. Meteore pro Stunde: ${showerObj.zhr}.`,
        fr: `N’oubliez pas d’observer le ciel ce soir ! Météores max par heure : ${showerObj.zhr}.`,
        es: `¡No olvides mirar al cielo esta noche! Meteoros máx. por hora: ${showerObj.zhr}.`,
        ar: `لا تنس مراقبة السماء الليلة! أقصى عدد شهب بالساعة: ${showerObj.zhr}.`,
        it: `Non dimenticare di osservare il cielo stasera! Meteore max all’ora: ${showerObj.zhr}.`,
        pt: `Não se esqueça de observar o céu esta noite! Máximo de meteoros por hora: ${showerObj.zhr}.`,
      };
      const body = bodyMessages[lang] || bodyMessages.en;

      // Faz 6.3: Android'de önce akanyıldız grafikli zengin bildirim; olmazsa temel yol.
      const scheduledAt = moveOutsideQuietHours(triggerAt, timeZone);
      const quietShifted = scheduledAt.getTime() !== triggerAt.getTime();
      let scheduled: 'exact' | 'inexact' | 'quiet' | false = false;
      if (Capacitor.getPlatform() === 'android') {
        scheduled = await scheduleRichMeteorPeak({
          id: alarmId,
          triggerAtMs: scheduledAt.getTime(),
          title,
          body,
          timeLabel: scheduledAt.toLocaleTimeString(lang, {
            hour: '2-digit',
            minute: '2-digit',
            timeZone,
          }),
          durationSeconds: 0,
          route: 'skyview://plan/meteor',
          exact: false,
        });
        if (scheduled && quietShifted) scheduled = 'quiet';
      }
      if (!scheduled) {
        scheduled = await scheduleNotification(alarmId, title, body, triggerAt, false, 'plan:meteor', timeZone);
      }
      if (scheduled) {
        appStorage.setString(alarmKey, '1');
        setAlarms(prev => ({ ...prev, [showerName]: true }));
        const setMessages: Record<LangCode, string> = {
          tr: `${showerDisplayName} alarmı kuruldu.`,
          en: `${showerDisplayName} alarm scheduled.`,
          de: `Alarm für ${showerDisplayName} gestellt.`,
          fr: `Alarme programmée pour ${showerDisplayName}.`,
          es: `Alarma programada para ${showerDisplayName}.`,
          ar: `تم ضبط منبه ${showerDisplayName}.`,
          it: `Sveglia impostata per ${showerDisplayName}.`,
          pt: `Alarme programado para ${showerDisplayName}.`,
        };
        // F4.4: quiet-hours postponement is a success, but it must be honest
        // about moving the alarm later than the event lead implies.
        showToast(scheduled === 'quiet'
          ? t('alarm.queuedQuiet', lang)
          : (setMessages[lang] || setMessages.en), { variant: 'success' });
      } else {
        appStorage.remove(alarmKey);
        setAlarms(prev => ({ ...prev, [showerName]: false }));
        showToast(alarmFailureMessage[lang] || alarmFailureMessage.en, { variant: 'danger' });
      }
    }
  };

  const upcoming = showers.filter(s => getLocalDayDiff(now, s.peak, timeZone) >= 0).sort((a, b) => a.peak.getTime() - b.peak.getTime());
  const past = showers.filter(s => getLocalDayDiff(now, s.peak, timeZone) < 0).sort((a, b) => b.peak.getTime() - a.peak.getTime());
  const nextYearPreview = upcoming.length === 0
    ? nextYearShowers.filter(s => s.peak.getTime() > now.getTime()).slice(0, 3)
    : [];
  // F6.10: hero geri sayım — ilk yaklaşan zirveye saat/dakika tanesine kadar;
  // `now` observer.instant (dakikalık tick) olduğu için interval gerekmez.
  const nextShower = upcoming[0] ?? nextYearPreview[0] ?? null;
  const countdownUnits: Record<LangCode, CountdownUnits> = {
    tr: { days: 'gün', hours: 'sa', minutes: 'dk' },
    en: { days: 'd', hours: 'h', minutes: 'min' },
    de: { days: 'T', hours: 'Std', minutes: 'Min' },
    fr: { days: 'j', hours: 'h', minutes: 'min' },
    es: { days: 'd', hours: 'h', minutes: 'min' },
    ar: { days: 'يوم', hours: 'ساعة', minutes: 'دقيقة' },
    it: { days: 'g', hours: 'h', minutes: 'min' },
    pt: { days: 'd', hours: 'h', minutes: 'min' },
  };
  const nextCountdown = nextShower
    ? formatCountdownToInstant(now, nextShower.peak, countdownUnits[lang] || countdownUnits.en)
    : null;
  const nextPeakLabel: Record<LangCode, string> = {
    tr: 'Sonraki zirve', en: 'Next peak', de: 'Nächster Höhepunkt',
    fr: 'Prochain pic', es: 'Próximo pico', ar: 'الذروة القادمة',
    it: 'Prossimo picco', pt: 'Próximo pico',
  };
  const daysToPeak = (d: Date) => {
    const diff = getLocalDayDiff(now, d, timeZone);
    if (diff < 0) return null;
    if (diff === 0) {
      const todayLabels: Record<LangCode, string> = {
        tr: 'Bugün', en: 'Today', de: 'Heute', fr: "Aujourd'hui", es: 'Hoy', ar: 'اليوم', it: 'Oggi', pt: 'Hoje'
      };
      return todayLabels[lang] || todayLabels.en;
    }
    if (diff === 1) {
      const tomorrowLabels: Record<LangCode, string> = {
        tr: 'Yarın', en: 'Tomorrow', de: 'Morgen', fr: 'Demain', es: 'Mañana', ar: 'غدا', it: 'Domani', pt: 'Amanhã'
      };
      return tomorrowLabels[lang] || tomorrowLabels.en;
    }

    const suffixLabels: Record<LangCode, string> = {
      tr: ' gün', en: ' days', de: ' Tage', fr: ' jours', es: ' días', ar: ' أيام', it: ' giorni', pt: ' dias'
    };
    const suffix = suffixLabels[lang] || suffixLabels.en;
    return `${diff}${suffix}`;
  };

  const zhrColor = (zhr: number) => {
    if (zhr >= 100) return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    if (zhr >= 40) return 'text-sky-400 bg-sky-500/15 border-white/5';
    if (zhr >= 15) return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    return 'text-slate-400 bg-slate-500/15 border-slate-500/30';
  };

  const labels: Record<string, Record<LangCode, string>> = {
    title: {
      en: 'Meteor Shower Calendar', tr: 'Meteor Yağmurları Takvimi', de: 'Meteorschauer-Kalender',
      fr: 'Calendrier des essaims météoritiques', es: 'Calendario de lluvias de meteoros', ar: 'تقويم زخات الشهب',
      it: 'Calendario degli sciami meteorici', pt: 'Calendário de chuvas de meteoros'
    },
    upcoming: {
      en: 'Upcoming Showers', tr: 'Yaklaşan Yağmurlar', de: 'Bevorstehende Schauer',
      fr: 'Essaims à venir', es: 'Próximas lluvias', ar: 'الزخات القادمة',
      it: 'Sciami in arrivo', pt: 'Próximas chuvas'
    },
    past: {
      en: 'Past Showers This Year', tr: 'Bu Yılki Geçmiş Yağmurlar', de: 'Vergangene Schauer dieses Jahr',
      fr: 'Essaims passés cette année', es: 'Lluvias pasadas este año', ar: 'الزخات السابقة هذا العام',
      it: 'Sciami passati quest’anno', pt: 'Chuvas passadas este ano'
    },
    parent: {
      en: 'Parent Body', tr: 'Kaynak', de: 'Mutterkörper',
      fr: 'Corps parent', es: 'Cuerpo progenitor', ar: 'الجرم الأم',
      it: 'Corpo genitore', pt: 'Corpo progenitor'
    },
    speed: {
      en: 'Speed', tr: 'Hız', de: 'Geschwindigkeit',
      fr: 'Vitesse', es: 'Velocidad', ar: 'السرعة',
      it: 'Velocità', pt: 'Velocidade'
    },
    radiant: {
      en: 'Radiant', tr: 'Işıma Noktası', de: 'Radiant',
      fr: 'Radiant', es: 'Radiante', ar: 'نقطة الإشعاع',
      it: 'Radiante', pt: 'Radiante'
    },
    bestTime: {
      en: 'Best Time', tr: 'En İyi Zaman', de: 'Beste Zeit',
      fr: 'Meilleur moment', es: 'Mejor momento', ar: 'أفضل وقت',
      it: 'Momento migliore', pt: 'Melhor horário'
    },
    tip: {
      en: 'Viewing Tip', tr: 'Gözlem İpucu', de: 'Beobachtungstipp',
      fr: 'Conseil d’observation', es: 'Consejo de observación', ar: 'نصيحة للمراقبة',
      it: 'Consiglio di osservazione', pt: 'Dica de observação'
    },
    zhrLabel: {
      en: 'Max Meteors/hr', tr: 'Maks. Meteor/Saat', de: 'Max. Meteore/Std',
      fr: 'Météores max/h', es: 'Meteoros máx./h', ar: 'أقصى شهب/ساعة',
      it: 'Meteore max/ora', pt: 'Meteoros máx./h'
    },
  };
  // noUncheckedIndexedAccess: sözlük tüm diller için dolu — eksikse boş UI metni
  const L = (k: keyof typeof labels) => labels[k]?.[lang] || labels[k]?.en || '';

  const renderShower = (shower: Shower, globalIdx: number, previewYear?: number) => {
    const dtp = daysToPeak(shower.peak);
    const isPast = shower.peak < now;
    const isOpen = expanded === globalIdx;
    const panelId = `meteor-shower-panel-${globalIdx}`;

    return (
      <div key={shower.name} className={`rounded-xl border transition-all overflow-hidden ${isPast ? 'border-white/5 opacity-60' : 'border-white/5 hover:border-white/5'}`}>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
          onClick={() => setExpanded(isOpen ? null : globalIdx)}
        >
          {/* ZHR badge */}
          <div className={`text-center min-w-[52px] py-1.5 px-2 rounded-xl border text-xs font-black ${zhrColor(shower.zhr)}`}>
            {shower.zhr}
 <div className="text-4xs font-semibold opacity-70 leading-none mt-0.5">ZHR</div>
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="font-semibold text-white text-sm">{getShowerName(shower.name, lang)}</span>
 {previewYear !== undefined && (
 <span className="text-2xs font-semibold bg-slate-700/40 text-slate-300 border border-white/5 px-1.5 py-0.5 rounded-full">
 {previewYear}
 </span>
 )}
 {!isPast && dtp && (
 <span className="text-2xs font-semibold bg-indigo-500/15 text-indigo-400 border border-white/5 px-1.5 py-0.5 rounded-full">
 {dtp}
 </span>
 )}
 {isPast && (
 <span className="text-2xs text-slate-600 border border-white/5 px-1.5 py-0.5 rounded-full">
 {shower.peak.toLocaleDateString(lang, { month: 'short', day: 'numeric', timeZone })}
 </span>
 )}
 </div>
 <div className="text-2xs text-slate-500 mt-0.5">
  {shower.radiant} · {shower.speed} km/s · {shower.duration}
 </div>
 </div>

 <div className="flex items-center gap-1 text-slate-600">
 {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
 </div>
 </button>

 {isOpen && (
 <div id={panelId} className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
 <p className="text-sm text-slate-300 leading-relaxed">
 {shower.description[lang] || shower.description.en}
 </p>

 <div className="grid grid-cols-2 gap-2">
 {[
 { icon: <Calendar className="w-3.5 h-3.5" />, label: 'Peak', val: shower.peak.toLocaleDateString(lang, { month: 'long', day: 'numeric', timeZone }) },
 { icon: <Zap className="w-3.5 h-3.5" />, label: L('speed'), val: `${shower.speed} km/s` },
 { icon: <Eye className="w-3.5 h-3.5" />, label: L('radiant'), val: shower.radiant },
 { icon: <MapPin className="w-3.5 h-3.5" />, label: L('bestTime'), val: shower.bestTime },
 ].map(item => (
 <div key={item.label} className="bg-slate-900/40 rounded-xl px-3 py-2 flex items-start gap-2">
 <span className="text-indigo-400 mt-0.5">{item.icon}</span>
 <div>
 <div className="text-3xs text-slate-500 uppercase font-semibold">{item.label}</div>
 <div className="text-xs text-white font-medium">{item.val}</div>
 </div>
 </div>
 ))}
 </div>

 <div className="bg-slate-800/30 border border-white/5 rounded-xl px-3 py-2.5 flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
 <div className="flex gap-2">
 <Eye className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
 <div>
 <div className="text-3xs text-indigo-400 font-semibold uppercase mb-0.5">{L('tip')}</div>
 <p className="text-xs text-slate-400 leading-relaxed">
 {shower.viewingTip[lang] || shower.viewingTip.en}
 </p>
 </div>
 </div>
 {!isPast && (
 <button
 onClick={() => toggleAlarm(shower.name)}
 className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 self-stretch sm:self-auto justify-center ${
 alarms[shower.name] 
 ? 'bg-slate-800/30 border-rose-500/40 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.1)]' 
 : 'bg-indigo-900/20 border-white/5 text-indigo-300 hover:bg-indigo-900/40'
 }`}
 >
 {alarms[shower.name] ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
 {alarms[shower.name] 
 ? t('alarm.cancel', lang)
 : t('alarm.notify', lang)}
 </button>
 )}
 </div>
 </div>
 )}
 </div>
 );
 };

 return (
 <div id="meteor-showers" className="bg-app-panel/90 backdrop-blur-md rounded-xl border border-white/5 p-5 shadow-sm relative scroll-mt-6">
 {/* F6.2: toast'lar ToastHost portalına taşındı; yerel markup kalktı. */}
 <div className="flex items-center gap-3 mb-5">
 <div className="w-9 h-9 bg-amber-500/15 rounded-xl flex items-center justify-center border border-amber-500/25">
 <Zap className="w-4 h-4 text-amber-400" />
 </div>
 <div>
 <h2 className="text-base font-semibold text-white">{L('title')}</h2>
 <p className="text-2xs text-slate-500">{year}</p>
 </div>
 </div>

 {/* F6.10: sonraki zirve hero geri sayımı — dakika tanesine kadar */}
 {nextShower && nextCountdown && (
 <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3" role="status">
 <Timer className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
 <div className="min-w-0">
 <div className="text-2xs font-semibold uppercase tracking-wider text-amber-300/80">{nextPeakLabel[lang] || nextPeakLabel.en}</div>
 <div className="text-sm font-semibold text-white tabular-nums truncate">
 {getShowerName(nextShower.name, lang)} · {nextCountdown}
 </div>
 </div>
 </div>
 )}

 <div className="space-y-2">
 {upcoming.length > 0 && (
 <>
 <p className="text-2xs text-indigo-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
 {L('upcoming')}
 </p>
 {upcoming.map((s, i) => renderShower(s, i))}
 </>
 )}

 {past.length > 0 && (
 <div className="mt-4">
 <p className="text-2xs text-slate-500 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
 {L('past')}
 </p>
 {past.map((s, i) => renderShower(s, upcoming.length + i))}
 </div>
 )}

 {nextYearPreview.length > 0 && (
 <div className="mt-4">
 <p className="text-2xs text-sky-400/80 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <span className="w-1.5 h-1.5 rounded-full bg-sky-400/80 inline-block" />
 {t('events.nextYearPreview', lang)}
 </p>
 {nextYearPreview.map((s, i) => renderShower(s, upcoming.length + past.length + i, year + 1))}
 </div>
 )}
 </div>
 </div>
 );
};
