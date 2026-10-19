import React, { useEffect, useState } from 'react';
import { Binoculars, BookOpen, CalendarPlus, Camera, Check, Clock3, Compass, Eye, Navigation, Star, Telescope, X } from 'lucide-react';
import { LangCode, t } from '../../i18n';
import { uiT } from '../../i18nUi';
import { EquipmentKind, LocationData, TonightTarget } from '../../types';
import { getLocalizedDescription } from '../../data/celestialDescriptions';
import { getTargetName } from '../../utils/targetNames';
import { OBSERVATION_DATA_CHANGED, observationRepository } from '../../repositories/observationRepository';
import { productT } from '../../i18nProduct';
import { localizeCompassCode } from '../../utils/compassLabels';
import { MultiStopSheet } from '../../components/ui/MultiStopSheet';
import { useCountUp } from '../../hooks/useCountUp';
import { successHaptic } from '../../utils/haptics';

// TUR 2: tam ekran modal yerine peek/half/full duraklı çekmece. İçerik aynı;
// yalnız sunum katmanı ve AR kısayolu eklendi.
const bodyId = (id: string) => `${id.charAt(0).toUpperCase()}${id.slice(1)}`;
const equipmentIcon = (kind: EquipmentKind) => kind === 'binoculars' ? Binoculars : kind === 'telescope' ? Telescope : kind === 'camera' ? Camera : Eye;

export const CelestialObjectDetail: React.FC<{
  target: TonightTarget;
  location: LocationData;
  lang: LangCode;
  onClose: () => void;
  onOpenAr?: () => void;
}> = ({ target, location, lang, onClose, onOpenAr }) => {
  const plannedFor = target.bestTime.toISOString();
  const [planned, setPlanned] = useState(() => observationRepository.listPlan().some(item => item.targetId === target.id && item.plannedFor === plannedFor));
  const [showLog, setShowLog] = useState(false);
  const [note, setNote] = useState('');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [logSaved, setLogSaved] = useState(false);
  useEffect(() => {
    const refresh = () => setPlanned(observationRepository.listPlan().some(item => item.targetId === target.id && item.plannedFor === plannedFor));
    refresh();
    window.addEventListener(OBSERVATION_DATA_CHANGED, refresh);
    return () => window.removeEventListener(OBSERVATION_DATA_CHANGED, refresh);
  }, [target.id, plannedFor]);
  const description = getLocalizedDescription(bodyId(target.id), lang);
  const equipmentLabels: Record<EquipmentKind, string> = {
    'naked-eye': t('equipment.nakedEye', lang),
    binoculars: t('equipment.binoculars', lang),
    telescope: t('equipment.telescope', lang),
    camera: t('equipment.camera', lang),
  };
  const points = target.altitudePoints;
  const targetName = getTargetName(target.id, lang);
  const altitudeDisplay = useCountUp(target.altitude);
  const path = points.map((point, index) => {
    const x = (index / Math.max(1, points.length - 1)) * 320;
    const y = 120 - Math.max(0, Math.min(90, point.altitude)) / 90 * 100;
    return `${index ? 'L' : 'M'} ${x} ${y}`;
  }).join(' ');

  return (
    <MultiStopSheet
      open
      onClose={onClose}
      ariaLabel={`${targetName} — ${uiT('sheet.dragHint', lang)}`}
      initialStop="half"
      expandLabel={uiT('sheet.expand', lang)}
      collapseLabel={uiT('sheet.collapse', lang)}
    >
      <div className="mx-auto max-w-2xl px-4 pb-6 sm:px-6">
        <header className="sticky top-0 z-10 -mx-4 flex items-center gap-3 border-b border-white/10 bg-app-surface px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">{t('celestial.details', lang)}</p>
            <h1 id="celestial-detail-title" className="truncate text-lg font-semibold text-white">{targetName}</h1>
          </div>
          {onOpenAr && (
            <button
              type="button"
              onClick={onOpenAr}
              className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 text-xs font-semibold text-sky-200"
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
              {uiT('sheet.arView', lang)}
            </button>
          )}
          <button type="button" onClick={onClose} aria-label={t('common.close', lang)} className="sv-icon-button shrink-0 text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="sv-panel-muted p-3"><p className="text-xs text-slate-400">{t('celestial.score', lang)}</p><p className="mt-1 font-display text-xl font-semibold text-sky-400">{target.score}</p></div>
          <div className="sv-panel-muted p-3"><p className="text-xs text-slate-400">{t('celestial.altitude', lang)}</p><p className="mt-1 font-display text-xl font-semibold text-white">{Math.round(altitudeDisplay)}°</p></div>
          <div className="sv-panel-muted p-3"><p className="text-xs text-slate-400">{t('celestial.direction', lang)}</p><p className="mt-1 font-display text-xl font-semibold text-white">{localizeCompassCode(target.direction, lang)}</p></div>
        </div>

        {description && <p className="mt-4 text-sm leading-relaxed text-slate-300">{description}</p>}

        <section className="mt-4 sv-panel-muted p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <p className="flex items-center gap-2 text-slate-300"><Clock3 className="h-4 w-4 text-sky-400" />{target.bestTime.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', timeZone: location.timezone })}</p>
            <p className="flex items-center gap-2 text-slate-300"><Compass className="h-4 w-4 text-indigo-400" />{localizeCompassCode(target.direction, lang)}</p>
          </div>
          <svg viewBox="0 0 320 130" className="mt-3 h-32 w-full" role="img" aria-label={t('celestial.altitudeCurve', lang)}>
            {[0, 30, 60, 90].map(value => <line key={value} x1="0" x2="320" y1={120 - value / 90 * 100} y2={120 - value / 90 * 100} stroke="rgba(148,163,184,.14)" />)}
            <path d={path} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex justify-between text-xs text-slate-400"><span>{points[0]?.time.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', timeZone: location.timezone })}</span><span>{t('today.tonight', lang)}</span><span>{points.at(-1)?.time.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', timeZone: location.timezone })}</span></div>
        </section>

        <section className="mt-4"><h2 className="text-sm font-semibold text-white">{t('celestial.suitableEquipment', lang)}</h2><div className="mt-2 flex flex-wrap gap-2">{target.equipment.map(kind => { const Icon = equipmentIcon(kind); return <span key={kind} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-200"><Icon className="h-4 w-4 text-indigo-400" />{equipmentLabels[kind]}</span>; })}</div></section>
        <section className="mt-4 grid gap-3 sm:grid-cols-2">
          <button type="button" disabled={planned} onClick={() => { observationRepository.addPlan({ targetId: target.id, targetName, plannedFor, location }); setPlanned(true); void successHaptic(); }} className="min-h-12 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-4 text-sm font-semibold text-indigo-200 disabled:text-emerald-300">
            {planned ? <Check className="mr-2 inline h-4 w-4" /> : <CalendarPlus className="mr-2 inline h-4 w-4" />}{planned ? productT('detail.planned', lang) : productT('detail.addPlan', lang)}
          </button>
          <button type="button" onClick={() => setShowLog(value => !value)} className="min-h-12 rounded-lg border border-white/10 px-4 text-sm font-semibold text-slate-200"><BookOpen className="mr-2 inline h-4 w-4" />{productT('detail.logObservation', lang)}</button>
        </section>
        {showLog && <section className="mt-3 space-y-3 border-t border-white/5 pt-4"><textarea value={note} onChange={event => setNote(event.target.value)} rows={3} placeholder={productT('journal.note', lang)} className="w-full resize-none rounded-lg border border-white/10 bg-slate-950/50 p-3 text-base text-white outline-none focus:border-indigo-400" /><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex">{[1,2,3,4,5].map(value => <button key={value} type="button" onClick={() => setRating(value as 1 | 2 | 3 | 4 | 5)} className="min-h-12 min-w-10 text-amber-300" aria-pressed={rating >= value}><Star className={`mx-auto h-5 w-5 ${rating >= value ? 'fill-current' : ''}`} /></button>)}</div><button type="button" disabled={!note.trim()} onClick={() => { observationRepository.addLog({ targetId: target.id, targetName, observedAt: new Date().toISOString(), location, note: note.trim(), rating }); setNote(''); setLogSaved(true); setShowLog(false); void successHaptic(); }} className="min-h-12 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{productT('journal.save', lang)}</button></div></section>}
        {logSaved && <p className="mt-3 text-sm text-emerald-300"><Check className="mr-1.5 inline h-4 w-4" />{productT('detail.logSaved', lang)}</p>}
      </div>
    </MultiStopSheet>
  );
};
