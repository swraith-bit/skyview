import React, { useEffect, useState } from 'react';
import { BookOpen, Check, Circle, Star, Trash2, X } from 'lucide-react';
import { LangCode, t } from '../../i18n';
import { productT } from '../../i18nProduct';
import { LocationData, ObservationLogEntry, ObservationPlanItem } from '../../types';
import { OBSERVATION_DATA_CHANGED, observationRepository } from '../../repositories/observationRepository';
import { Panel } from '../../components/ui/Surface';
import { BottomSheet } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { selectionHaptic, successHaptic, warningHaptic } from '../../utils/haptics';

export const ObservationWorkspace: React.FC<{ lang: LangCode; location: LocationData }> = ({ lang, location }) => {
  const [plan, setPlan] = useState<ObservationPlanItem[]>(() => observationRepository.listPlan());
  const [logs, setLogs] = useState<ObservationLogEntry[]>(() => observationRepository.listLogs());
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState('');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(4);

  useEffect(() => {
    const refresh = () => { setPlan(observationRepository.listPlan()); setLogs(observationRepository.listLogs()); };
    window.addEventListener(OBSERVATION_DATA_CHANGED, refresh);
    return () => window.removeEventListener(OBSERVATION_DATA_CHANGED, refresh);
  }, []);

  const saveGeneralLog = () => {
    if (!note.trim()) return;
    observationRepository.addLog({ targetId: 'general', targetName: t('today.generalObservation', lang), observedAt: new Date().toISOString(), location, note: note.trim(), rating });
    setNote('');
    setShowForm(false);
    // F6.8: form kapanışı sert sessiz geçiştir değil; kayıt tamamlandı vuruşu.
    void successHaptic();
  };

  return (
    <Panel className="p-4 sm:p-5">
      <div className="grid gap-6 lg:grid-cols-2 lg:divide-x lg:divide-white/5">
        <section>
          <h2 className="text-base font-semibold text-white">{productT('plan.title', lang)}</h2>
          <div className="mt-3 space-y-1">
            {plan.length === 0 && <EmptyState compact message={productT('plan.empty', lang)} />}
            {plan.map(item => (
              <div key={item.id} className="flex min-h-14 items-center gap-3 border-b border-white/5 py-2 last:border-0">
                <button type="button" onClick={() => { void selectionHaptic(); observationRepository.togglePlan(item.id); }} aria-label={productT('plan.completed', lang)} className="min-h-12 min-w-12 rounded-lg text-indigo-300 flex items-center justify-center">{item.completed ? <Check className="h-5 w-5" /> : <Circle className="h-5 w-5" />}</button>
                <div className="min-w-0 flex-1"><p className={`font-medium ${item.completed ? 'text-slate-500 line-through' : 'text-white'}`}>{item.targetName}</p><p className="text-xs text-slate-500">{new Date(item.plannedFor).toLocaleString(lang, { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: item.location.timezone })}</p></div>
                <button type="button" onClick={() => { void warningHaptic(); observationRepository.removePlan(item.id); }} aria-label={productT('plan.remove', lang)} className="min-h-12 min-w-12 rounded-lg text-slate-500 flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </section>
        <section className="lg:pl-6">
          {/* F5.4: "günlük ekle" formu inline-expand yerine kanonik BottomSheet (modal ailesi). */}
          <div className="flex items-center justify-between gap-3"><h2 className="text-base font-semibold text-white">{productT('journal.title', lang)}</h2><button type="button" onClick={() => setShowForm(true)} className="min-h-12 rounded-lg px-3 text-sm font-semibold text-indigo-300"><BookOpen className="mr-1.5 inline h-4 w-4" />{productT('journal.add', lang)}</button></div>
          <BottomSheet
            open={showForm}
            onClose={() => setShowForm(false)}
            ariaLabel={productT('journal.title', lang)}
            panelClassName="p-4 sm:p-5 pb-safe-area"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">{productT('journal.title', lang)}</h3>
              <button type="button" onClick={() => setShowForm(false)} aria-label={t('common.close', lang)} className="sv-icon-button text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3"><textarea value={note} onChange={event => setNote(event.target.value)} rows={3} placeholder={productT('journal.note', lang)} className="w-full resize-none rounded-lg border border-white/10 bg-slate-950/50 p-3 text-base text-white outline-none focus:border-indigo-400" /><div className="flex items-center justify-between gap-3"><div className="flex" aria-label={productT('journal.rating', lang)}>{([1,2,3,4,5] as const).map(value => <button key={value} type="button" onClick={() => setRating(value)} className="min-h-12 min-w-10 text-amber-300" aria-pressed={rating >= value}><Star className={`mx-auto h-5 w-5 ${rating >= value ? 'fill-current' : ''}`} /></button>)}</div><button type="button" disabled={!note.trim()} onClick={saveGeneralLog} className="min-h-12 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{productT('journal.save', lang)}</button></div></div>
          </BottomSheet>
          <div className="mt-2 space-y-1">{logs.length === 0 && <EmptyState compact message={productT('journal.empty', lang)} />}{logs.slice(0, 4).map(log => <div key={log.id} className="flex items-start gap-3 border-b border-white/5 py-3 last:border-0"><div className="min-w-0 flex-1"><p className="font-medium text-white">{log.targetName}</p><p className="mt-0.5 text-sm text-slate-400 break-words">{log.note}</p><p className="mt-1 text-xs text-slate-500">{new Date(log.observedAt).toLocaleString(lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: log.location.timezone })}</p></div><span className="shrink-0 text-xs text-amber-300">{log.rating}/5</span></div>)}</div>
        </section>
      </div>
    </Panel>
  );
};
