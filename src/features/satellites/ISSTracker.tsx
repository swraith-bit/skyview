import React, { useEffect, useState } from 'react';
import { t } from '../../i18n';
import { Satellite, Activity, Clock, Bell, BellOff } from 'lucide-react';
import { scheduleNotification, cancelNotification, ensureExactAlarmPermission, moveOutsideQuietHours } from '../../utils/notifications';
import { cancelRichEvent, scheduleRichIssPass } from '../../native/richNotifications';
import { getIssAlarmId } from '../../utils/scheduledAlertCleanup';
import { Capacitor } from '@capacitor/core';
import { getNotificationPreferences } from '../../utils/featureStorage';
import { appStorage } from '../../repositories/storageRepository';
import { useAppStore } from '../../store/useAppStore';
import { showToast } from '../../store/toastStore';
import { fetchIssPasses, fetchIssPosition, IssPass } from '../../services/issService';
import { computeIssAlarmTriggerMs } from '../../utils/alarmTiming';
import { DEG_TO_RAD, ISS_INCLINATION_DEG, groundTrackLatitudeRad, groundTrackNodeRad } from './groundTrack';

const WORLD_LAND_MASK = [
 "000000000000000000000000000000000000",
 "000000000000000000011111110000000000",
 "000000000000000011111111111110000000",
 "000001110000001111111111111111000000",
 "001111111000011111111111111111110000",
 "011111111100111111111111111111100000",
 "001111111000111111111111111111000000",
 "000111110000011111111111111111000000",
 "000011100000001111111111111111000000",
 "000011110000000111111111111111000000",
 "000001111000000011111111111111000000",
 "000000111000000000111111000011100000",
 "000000010000000000001100000011100000",
 "000000000000000000000000000000000000",
 "000000000000000000000000000000000000",
 "111111111111111111111111111111111111",
 "111111111111111111111111111111111111"
];

const NextPassTimer: React.FC<{ nextPass: IssPass }> = ({ nextPass }) => {
  const { lang } = useAppStore();
  const [{hours, mins, secs}, setCountdown] = useState({hours: 0, mins: 0, secs: 0});

  useEffect(() => {
    if (!nextPass) return;
    const updateTimer = () => {
      const riseMs = new Date(nextPass.rise.time).getTime();
      if (isNaN(riseMs)) {
        setCountdown({ hours: 0, mins: 0, secs: 0 });
        return;
      }
      const diff = riseMs - Date.now();
      if (diff <= 0) {
        setCountdown({ hours: 0, mins: 0, secs: 0 });
      } else {
        const totalSecs = Math.floor(diff / 1000);
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        setCountdown({ hours: h, mins: m, secs: s });
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextPass]);

  return (
    <div className="flex items-center justify-end gap-1.5 font-mono text-xl text-slate-200">
      <div className="bg-slate-900/40 border border-white/5 rounded-md px-2 py-1 min-w-[2.5rem] text-center">{(isNaN(hours) ? 0 : hours).toString().padStart(2, '0')}<span className="text-2xs text-slate-500 font-sans ml-0.5">{t('iss.hours', lang)}</span></div><span className="text-slate-600">:</span>
      <div className="bg-slate-900/40 border border-white/5 rounded-md px-2 py-1 min-w-[2.5rem] text-center">{(isNaN(mins) ? 0 : mins).toString().padStart(2, '0')}<span className="text-2xs text-slate-500 font-sans ml-0.5">{t('iss.mins', lang)}</span></div><span className="text-slate-600">:</span>
      <div className="bg-slate-900/40 border border-white/5 rounded-md px-2 py-1 min-w-[2.5rem] text-center text-sky-400">{(isNaN(secs) ? 0 : secs).toString().padStart(2, '0')}<span className="text-2xs text-slate-500 font-sans ml-0.5 text-sky-500">{t('iss.secs', lang)}</span></div>
    </div>
  );
};

export const ISSTracker: React.FC = () => {
  const { lang, currentLocation } = useAppStore();
 const [issData, setIssData] = useState<{ lat: number; lng: number; alt: number; vel: number; timestamp: number } | null>(null);
 const [issError, setIssError] = useState(false);
 
 // Ref to track latest issData without triggering effect rebuilds
 const issDataRef = React.useRef(issData);
 useEffect(() => {
 issDataRef.current = issData;
 }, [issData]);

 const [nextPass, setNextPass] = useState<IssPass | null>(null);
 const [passLoading, setPassLoading] = useState(false);
 const [passError, setPassError] = useState(false);
 // F1.1 guards: refresh an elapsed cached pass at most once; throttle repeat error toasts.
 const staleRefreshAttemptedRef = React.useRef(false);
 const lastPassErrorToastRef = React.useRef(0);
 const [passRefreshKey, setPassRefreshKey] = useState(0);

 // Start with false — synced via useEffect once nextPass loads
 const [isAlarmSet, setIsAlarmSet] = useState<boolean>(false);
 // F6.2: local toast state removed — messages flow through the showToast channel.
 const getAlarmKey = (riseTime: string) => `iss_alarm_${riseTime}`;

 const langRef = React.useRef(lang);
 useEffect(() => {
   langRef.current = lang;
 }, [lang]);

 // Sync state if nextPass changes
 useEffect(() => {
 if (nextPass) {
 const riseTime = String(nextPass.rise.time);
 const alarmTime = appStorage.getString('iss_alarm_time');
 setIsAlarmSet(appStorage.getString(getAlarmKey(riseTime)) === '1' || alarmTime === riseTime);
 }
 }, [nextPass]);

 const toggleAlarm = async () => {
 if (!nextPass) return;
 if (!getNotificationPreferences().issAlerts) {
 showToast(t('iss.disabled', lang));
 return;
 }
 const riseTime = String(nextPass.rise.time);
 const alarmKey = getAlarmKey(riseTime);
 
 if (isAlarmSet) {
 appStorage.remove(alarmKey);
 appStorage.remove('iss_alarm_time');
 setIsAlarmSet(false);
 
 const removedMsg = t('iss.alarmRemoved', lang);
 showToast(removedMsg);

  const alarmId = getIssAlarmId(riseTime);
  if (alarmId !== null) {
    await cancelNotification(alarmId);
    await cancelRichEvent(alarmId);
  }
 } else {
  const alarmId = getIssAlarmId(riseTime);
  if (alarmId === null) {
  showToast(t('iss.error', lang), { variant: 'danger' });
  return;
  }
 const riseTimeMs = new Date(nextPass.rise.time).getTime();
 // F4.4: rise − 15 min used to land in the past for imminent passes → a silent
 // "error". The trigger now clamps forward (rise itself instead of failing);
 // only a fully elapsed pass still reports the error path.
 const triggerTimeMs = computeIssAlarmTriggerMs(riseTimeMs, Date.now());
 if (triggerTimeMs === null) {
 showToast(t('iss.error', lang), { variant: 'danger' });
 return;
 }
 // True when the alarm fires later than the standard lead (imminent pass).
 const clampedLead = triggerTimeMs !== riseTimeMs - 15 * 60 * 1000;

 const title = t('iss.alarmTitle', lang);
 const body = t('iss.alarmBody', lang);
 // Sessiz saatler zengin yolda da geçerli: yerel alarmı sessiz pencerenin
 // dışına taşı, aksi halde "kuruldu" mesajı saati gizlerdi.
 const scheduledAt = moveOutsideQuietHours(new Date(triggerTimeMs), currentLocation.timezone);
 const quietShifted = scheduledAt.getTime() !== triggerTimeMs;

 let scheduled: 'exact' | 'inexact' | 'quiet' | false = false;
 if (Capacitor.getPlatform() === 'android') {
   // Faz 6.3: önce mini yörünge grafikli zengin bildirim; olmazsa temel yol.
   const exactAllowed = await ensureExactAlarmPermission();
   await cancelNotification(alarmId);
   scheduled = await scheduleRichIssPass({
     id: alarmId,
     triggerAtMs: scheduledAt.getTime(),
     title,
     body,
     timeLabel: new Date(riseTimeMs).toLocaleTimeString(lang, {
       hour: '2-digit',
       minute: '2-digit',
       timeZone: currentLocation.timezone,
     }),
     durationSeconds: nextPass.duration_sec,
     route: 'skyview://sky/iss',
     exact: exactAllowed,
   });
   if (scheduled && quietShifted) scheduled = 'quiet';
 }
 if (!scheduled && Capacitor.isNativePlatform()) {
 scheduled = await scheduleNotification(alarmId, title, body, new Date(triggerTimeMs), true, 'sky:iss', currentLocation.timezone);
 }

 if (scheduled) {
 appStorage.setString(alarmKey, '1');
 appStorage.setString('iss_alarm_time', riseTime);
 setIsAlarmSet(true);
 showToast(t(
 scheduled === 'quiet' || scheduled === 'inexact' || clampedLead
 ? 'iss.alarmSetApproximate'
 : 'iss.alarmSet',
 lang,
 ), { variant: 'success' });
 } else {
 showToast(t('iss.error', lang), { variant: 'danger' });
 }
 }
 };

 // F6.2: auto-clear moved into the toast channel (store-managed timers).

  useEffect(() => {
    let active = true;
    let activeController: AbortController | null = null;

    const fetchISS = async () => {
      if (!navigator.onLine) {
        setIssError(true);
        if (!issDataRef.current) showToast(t('iss.error', langRef.current), { variant: 'danger' });
        return;
      }
      const controller = new AbortController();
      activeController?.abort();
      activeController = controller;
      try {
        const data = await fetchIssPosition(controller.signal);
        if (!active) return;
        setIssData(data);
        setIssError(false);
      } catch (err) {
        if (!active || (err instanceof DOMException && err.name === 'AbortError')) return;
        console.error("ISS API Error", err);
        setIssError(true);
        if (!issDataRef.current) {
          showToast(t('iss.error', langRef.current), { variant: 'danger' });
        }
      }
    };
    let interval: NodeJS.Timeout | null = null;
    const startPolling = () => {
      if (!interval) interval = setInterval(fetchISS, 15000); // 15s interval
    };
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    fetchISS();
    startPolling();

    const handleVisibility = () => {
      if (document.hidden) stopPolling();
      else {
        fetchISS();
        startPolling();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      activeController?.abort();
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

 // Real Predictor for ISS Passes using polluxlabs API
 useEffect(() => {
 if (!currentLocation) return;

 let active = true;
 const controller = new AbortController();
 setNextPass(null);
 setPassError(false);
 setPassLoading(true);
 const fetchPass = async () => {
 try {
  const result = await fetchIssPasses(currentLocation, controller.signal);
  if (!active) return;
  setNextPass(result.passes[0] ?? null);
 } catch (err) {
 if (!active) return;
 console.error("ISS Pass API Error", err);
 setPassError(true);
 // F1.1: one-minute cooldown prevents the same failure from toast-spamming.
 if (Date.now() - lastPassErrorToastRef.current > 60_000) {
 lastPassErrorToastRef.current = Date.now();
 showToast(t('iss.error', langRef.current), { variant: 'danger' });
 }
 } finally {
  if (active) setPassLoading(false);
 }
 };
 
 fetchPass();

 return () => {
 active = false;
  controller.abort();
 };
 }, [currentLocation, passRefreshKey]);

 useEffect(() => {
 if (!nextPass) return;
 const riseMs = new Date(nextPass.rise.time).getTime();
 if (!Number.isFinite(riseMs)) return;
 const refreshAt = riseMs + Math.max(0, nextPass.duration_sec) * 1000 + 60_000;
 if (refreshAt <= Date.now()) {
 // F1.1: the cached pass fully elapsed -> force exactly one refresh instead of a ~1 Hz loop.
 if (!staleRefreshAttemptedRef.current) {
 staleRefreshAttemptedRef.current = true;
 setPassRefreshKey(value => value + 1);
 }
 return;
 }
 staleRefreshAttemptedRef.current = false;
 const delay = Math.max(1_000, refreshAt - Date.now());
 const timer = window.setTimeout(() => setPassRefreshKey(value => value + 1), delay);
 return () => window.clearTimeout(timer);
 }, [nextPass]);

 const canvasRef = React.useRef<HTMLCanvasElement>(null);
 const lastPosRef = React.useRef<{ lat: number; lng: number } | null>(null);
 const isMovingNorthRef = React.useRef<boolean>(true);

 // Monitor ISS moving direction
 useEffect(() => {
 if (issData) {
 if (lastPosRef.current) {
 if (issData.lat !== lastPosRef.current.lat) {
 isMovingNorthRef.current = issData.lat > lastPosRef.current.lat;
 }
 }
 lastPosRef.current = { lat: issData.lat, lng: issData.lng };
 }
 }, [issData]);

 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;

 let animId: number;
 let sweepAngle = 0;
 let isDestroyed = false;
 let isVisible = !document.hidden;
 let lastFrameTime = 0;

 const handleVisibilityChange = () => {
 isVisible = !document.hidden;
 if (isVisible && !isDestroyed) {
 animId = requestAnimationFrame(render);
 } else {
 cancelAnimationFrame(animId);
 }
 };
 document.addEventListener('visibilitychange', handleVisibilityChange);

 const render = (frameTime: number) => {
 if (isDestroyed) return;
 if (!isVisible) return;
 if (frameTime - lastFrameTime < 100) {
 animId = requestAnimationFrame(render);
 return;
 }
 lastFrameTime = frameTime;
 const ctx = canvas.getContext('2d');
 if (!ctx) return;

 const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
 const rect = canvas.getBoundingClientRect();
 const w = rect.width;
 const h = rect.height;

 if (w <= 0 || h <= 0) {
 animId = requestAnimationFrame(render);
 return;
 }

 // Handle canvas resizing for HDPI
 if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
 canvas.width = Math.floor(w * dpr);
 canvas.height = Math.floor(h * dpr);
 }

 ctx.save();
 ctx.scale(dpr, dpr);
 ctx.clearRect(0, 0, w, h);

 // 1. Draw Longitudinal and Latitudinal Grid lines
 ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
 ctx.lineWidth = 0.5;
 for (let x = 0; x <= w; x += w / 12) {
 ctx.beginPath();
 ctx.moveTo(x, 0);
 ctx.lineTo(x, h);
 ctx.stroke();
 }
 for (let y = 0; y <= h; y += h / 8) {
 ctx.beginPath();
 ctx.moveTo(0, y);
 ctx.lineTo(w, y);
 ctx.stroke();
 }

 // 2. Draw Futuristic Matrix World Map
 const rows = WORLD_LAND_MASK.length;
 // noUncheckedIndexedAccess: maske sabit dolu; olası boş grid → çizim yok
 const cols = WORLD_LAND_MASK[0]?.length ?? 0;
 const dotRadius = 1.8;
 
 for (let r = 0; r < rows; r++) {
 const rowData = WORLD_LAND_MASK[r];
 if (!rowData) continue; // noUncheckedIndexedAccess: satır sabit mevcut
 const yPos = ((r + 0.5) / rows) * (h - 20) + 10;
 for (let c = 0; c < cols; c++) {
 if (rowData[c] === '1') {
 const xPos = ((c + 0.5) / cols) * (w - 20) + 10;
 
 // Faint glow on land dots
 ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
 ctx.beginPath();
 ctx.arc(xPos, yPos, dotRadius, 0, Math.PI * 2);
 ctx.fill();
 }
 }
 }

 // 3. Draw ISS Orbit Line (If active)
 const currentIss = issDataRef.current;
 if (currentIss) {
 // F4.3: exact circular-orbit ground track — φ = asin(sin i · sin u) with a
 // consistent node solve, replacing the linear-scale i · sin(Δλ) approximation.
 const inclinationRad = ISS_INCLINATION_DEG * DEG_TO_RAD;
 const L0 = groundTrackNodeRad(currentIss, isMovingNorthRef.current, inclinationRad);

 ctx.beginPath();
 let first = true;
 for (let lngDeg = -180; lngDeg <= 180; lngDeg += 3) {
 const lngRad = (lngDeg * Math.PI) / 180;
 const latDeg = groundTrackLatitudeRad(lngRad - L0, inclinationRad) / DEG_TO_RAD;

 // Map spherical coordinates to flat canvas
 const xPos = ((lngDeg + 180) / 360) * (w - 20) + 10;
 const yPos = ((90 - latDeg) / 180) * (h - 20) + 10;

 if (first) {
 ctx.moveTo(xPos, yPos);
 first = false;
 } else {
 ctx.lineTo(xPos, yPos);
 }
 }
 ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
 ctx.lineWidth = 1.5;
 ctx.stroke();
 }

 // 4. Draw ISS pulsating target marker & sweep line
 if (currentIss) {
 const xPos = ((currentIss.lng + 180) / 360) * (w - 20) + 10;
 const yPos = ((90 - currentIss.lat) / 180) * (h - 20) + 10;

 // Pulsating outer sonar rings
 const pulseRatio = (Date.now() % 1600) / 1600;
 ctx.strokeStyle = `rgba(56, 189, 248, ${1 - pulseRatio})`;
 ctx.lineWidth = 1.2;
 ctx.beginPath();
 ctx.arc(xPos, yPos, 10 + pulseRatio * 25, 0, Math.PI * 2);
 ctx.stroke();

 ctx.strokeStyle = `rgba(6, 182, 212, ${0.8 - pulseRatio})`;
 ctx.beginPath();
 ctx.arc(xPos, yPos, 2 + pulseRatio * 15, 0, Math.PI * 2);
 ctx.stroke();

 // Draw radar sweep line spinning from the ISS location
 sweepAngle = (sweepAngle + 0.02) % (Math.PI * 2);
 const sweepLen = 45;
 const sx = xPos + Math.cos(sweepAngle) * sweepLen;
 const sy = yPos + Math.sin(sweepAngle) * sweepLen;

 const sweepGrad = ctx.createLinearGradient(xPos, yPos, sx, sy);
 sweepGrad.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
 sweepGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
 
 ctx.strokeStyle = sweepGrad;
 ctx.lineWidth = 2.5;
 ctx.beginPath();
 ctx.moveTo(xPos, yPos);
 ctx.lineTo(sx, sy);
 ctx.stroke();

 // Target Box surrounding ISS
 ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
 ctx.lineWidth = 1;
 const bs = 6; // box size
 ctx.beginPath();
 // Top-left corner
 ctx.moveTo(xPos - bs, yPos - bs + 2); ctx.lineTo(xPos - bs, yPos - bs); ctx.lineTo(xPos - bs + 2, yPos - bs);
 // Top-right corner
 ctx.moveTo(xPos + bs, yPos - bs + 2); ctx.lineTo(xPos + bs, yPos - bs); ctx.lineTo(xPos + bs - 2, yPos - bs);
 // Bottom-left corner
 ctx.moveTo(xPos - bs, yPos + bs - 2); ctx.lineTo(xPos - bs, yPos + bs); ctx.lineTo(xPos - bs + 2, yPos + bs);
 // Bottom-right corner
 ctx.moveTo(xPos + bs, yPos + bs - 2); ctx.lineTo(xPos + bs, yPos + bs); ctx.lineTo(xPos + bs - 2, yPos + bs);
 ctx.stroke();

 // ISS Core Dot
 ctx.fillStyle = '#bae6fd';
 ctx.beginPath();
 ctx.arc(xPos, yPos, 2, 0, Math.PI * 2);
 ctx.fill();
 }

 ctx.restore();
 animId = requestAnimationFrame(render);
 };

 animId = requestAnimationFrame(render);
 return () => {
 isDestroyed = true;
 cancelAnimationFrame(animId);
 document.removeEventListener('visibilitychange', handleVisibilityChange);
 };
 }, []);

 const getRelativeTime = (ts: number, langCode: string) => {
 const diffMins = Math.floor((Date.now() - ts) / 60000);
 if (langCode === 'tr') return `Son güncel veri: ${diffMins} dk önce`;
 if (langCode === 'de') return `Zuletzt aktualisiert: vor ${diffMins} Min`;
 if (langCode === 'fr') return `Dernière mise à jour: il y a ${diffMins} min`;
 if (langCode === 'es') return `Última actualización: hace ${diffMins} min`;
 if (langCode === 'ar') return `آخر تحديث: منذ ${diffMins} دقيقة`;
 if (langCode === 'it') return `Ultimo aggiornamento: ${diffMins} min fa`;
 if (langCode === 'pt') return `Última atualização: há ${diffMins} min`;
 return `Last updated: ${diffMins} mins ago`;
 };

 const formatPassDuration = (seconds: number, langCode: string) => {
 const minutes = Math.floor(seconds / 60);
 const remainingSeconds = seconds % 60;
 if (langCode === 'tr') return `${minutes} dk ${remainingSeconds} sn`;
 return `${minutes} min ${remainingSeconds} sec`;
 };

 return (
 <div className="bg-slate-900/40 rounded-xl border border-white/5 p-6 lg:p-8 relative overflow-hidden">
 {/* F6.2: toast'lar ToastHost portalına taşındı; yerel markup kalktı. */}

 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-white/5 flex items-center justify-center">
 <Satellite className="w-5 h-5 text-sky-400" />
 </div>
 <div>
 <h2 className="text-xl font-medium text-slate-100 tracking-tight">{t('iss.title', lang)}</h2>
 <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-2">
  {issData?.timestamp ? (
  <><Clock className={`w-3.5 h-3.5 ${issError ? 'text-amber-500/80' : 'text-emerald-500/80'}`} /> <span className={`${issError ? 'text-amber-500/80' : 'text-slate-400'} text-xs`}>{getRelativeTime(issData.timestamp, lang)}</span></>
 ) : (
 <><Activity className="w-3.5 h-3.5 text-emerald-500/80" /> <span className="text-xs">{t('iss.refresh', lang)}</span></>
 )}
 </p>
 <p className="text-slate-500 text-xs mt-1.5 max-w-md leading-relaxed">
 {t('iss.info', lang)}
 </p>
 </div>
 </div>

 {/* Prediction Card */}
 {nextPass && !passLoading ? (
 <div className="w-full min-w-0 md:w-auto md:min-w-[280px] bg-slate-800/30 border border-white/5 rounded-xl p-4 flex flex-col md:items-end justify-center">
 <span className="text-2xs font-medium uppercase tracking-widest text-slate-400 md:text-right flex items-center gap-1.5 justify-start md:justify-end mb-1"><Clock className="w-3.5 h-3.5"/> {t('iss.passTitle', lang)}</span>
 <span className="text-sm text-slate-300 md:text-right mb-2">
  {new Date(nextPass.rise.time).toLocaleString(
  { en: 'en-US', tr: 'tr-TR', de: 'de-DE', fr: 'fr-FR', es: 'es-ES', it: 'it-IT', pt: 'pt-PT', ar: 'ar-EG' }[lang] || 'en-US',
  { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: currentLocation.timezone }
  )} 
  <span className="text-slate-500 text-xs ml-1">({formatPassDuration(nextPass.duration_sec, lang)})</span>
 </span>
 <div className="flex gap-3 w-full justify-between md:justify-end items-center mb-4">
 <span className={`text-2xs font-medium ${nextPass.visible ? 'text-emerald-400/80' : 'text-slate-500'} md:text-right`}>
  {nextPass.visible ? t('iss.visible', lang) : t('iss.notVisible', lang)}
  </span>
  <span className="text-2xs text-slate-500">
  {t('iss.alarmHint', lang)}
  </span>
 <button
 onClick={toggleAlarm}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-medium border transition-colors ${
 isAlarmSet 
 ? 'bg-slate-800/50 border-white/10 text-slate-300' 
 : 'bg-sky-500/10 border-white/5 text-sky-400 hover:bg-sky-500/20'
 }`}
 >
 {isAlarmSet ? <BellOff className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
 {isAlarmSet 
 ? t('alarm.cancel', lang)
 : t('alarm.set', lang)}
 </button>
 </div>
      <NextPassTimer nextPass={nextPass} />
    </div>
 ) : passLoading ? (
 <div className="w-full min-w-0 md:w-auto md:min-w-[280px] bg-slate-800/30 border border-white/5 rounded-xl p-4 space-y-3" role="status" aria-label={t('iss.loadingPass', lang)}>
 <div className="skeleton-block h-3 w-28" />
 <div className="flex justify-between gap-3">
 <div className="skeleton-block h-8 w-20" />
 <div className="skeleton-block h-8 w-32" />
 </div>
 </div>
 ) : passError ? (
 <div className="w-full min-w-0 md:w-auto md:min-w-[280px] bg-slate-800/30 border border-white/5 rounded-xl p-4 flex items-center justify-center">
 <span className="text-xs text-slate-500 text-center">{t('iss.error', lang)}</span>
 </div>
 ) : null}
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
 <StatBox label={t('iss.lat', lang)} value={issData?.lat.toFixed(4) ?? '---'} unit="°" />
 <StatBox label={t('iss.lng', lang)} value={issData?.lng.toFixed(4) ?? '---'} unit="°" />
 <StatBox label={t('iss.alt', lang)} value={issData?.alt.toFixed(1) ?? '---'} unit="km" />
 <StatBox label={t('iss.vel', lang)} value={issData ? Math.round(issData.vel).toString() : '---'} unit="km/h" />
 </div>

 {/* Mini Radar / Visual Representation */}
 <div className="mt-8 bg-slate-900/40 rounded-xl border border-white/5 h-64 relative overflow-hidden z-10">
 <canvas ref={canvasRef} className="w-full h-full" />
 </div>
 </div>
 );
};

const StatBox = ({ label, value, unit }: { label: string, value: string, unit: string }) => (
 <div className="bg-slate-800/20 border border-white/5 p-4 rounded-xl flex flex-col items-start justify-center text-left">
 <span className="text-2xs uppercase tracking-wider text-slate-500 font-medium mb-1">{label}</span>
 <div className="flex items-baseline gap-1.5">
 <span className="text-xl font-medium text-slate-200">{value}</span>
 <span className="text-xs text-slate-500">{unit}</span>
 </div>
 </div>
);
