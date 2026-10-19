import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CircleHelp } from 'lucide-react';
import { LangCode } from '../../i18n';
import { scoreT } from '../../i18nScore';
import { ObservationProfile, ObservationScoreReport, ScoreFactor } from '../../utils/observationScore';

const profiles: ObservationProfile[] = ['general', 'planetary', 'deepSky', 'meteor'];

type ScoreExplanationProps = {
  report: ObservationScoreReport;
  lang: LangCode;
  loading?: boolean;
  label?: string;
};

export const ScoreSummaryButton: React.FC<ScoreExplanationProps & {
  open: boolean;
  onToggle: () => void;
}> = ({ report, lang, loading, label, open, onToggle }) => (
  <button type="button" onClick={onToggle} aria-expanded={open} aria-controls="observation-score-details" className="group text-left rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">
    <span className="text-sm text-slate-400">{label ?? scoreT('general', lang)}</span>
    <span className="mt-1 flex flex-wrap items-end gap-x-2 gap-y-1">
      <span className="text-4xl font-semibold text-white">{loading ? '--' : report.profiles.general.score}<span className="text-base text-slate-500">/100</span></span>
      <span className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold text-indigo-300"><CircleHelp className="h-3.5 w-3.5" />{scoreT('why', lang)}{open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</span>
    </span>
  </button>
);

export const ScoreExplanationPanel: React.FC<ScoreExplanationProps & {
  onClose: () => void;
}> = ({ report, lang, onClose }) => {
  const [profile, setProfile] = useState<ObservationProfile>('general');
  const selected = report.profiles[profile];
  const confidenceTone = report.confidence === 'high' ? 'text-emerald-300' : report.confidence === 'medium' ? 'text-amber-300' : 'text-rose-300';

  return (
        <section id="observation-score-details" className="mt-4 rounded-xl border border-white/10 bg-slate-950/45 p-4" aria-label={scoreT('title', lang)}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">{scoreT('title', lang)}</h2>
            <p className={`text-xs font-semibold ${confidenceTone}`}>{scoreT('confidence', lang)}: {scoreT(report.confidence, lang)} · %{report.confidenceScore}</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist">
            {profiles.map(item => (
              <button key={item} type="button" role="tab" aria-selected={profile === item} onClick={() => setProfile(item)} className={`min-h-11 rounded-lg border px-2 text-xs font-semibold ${profile === item ? 'border-indigo-400/60 bg-indigo-500/15 text-indigo-200' : 'border-white/5 text-slate-400'}`}>
                {scoreT(item, lang)} · {report.profiles[item].score}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {selected.components.map(component => (
              <div key={component.factor}>
                <div className="mb-1 flex items-center justify-between text-xs"><span className="text-slate-300">{scoreT(component.factor as ScoreFactor, lang)}</span><span className="font-mono text-slate-400">%{component.value}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label={scoreT(component.factor as ScoreFactor, lang)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={component.value}>
                  <div className="h-full rounded-full bg-sky-400" style={{ width: `${component.value}%`, opacity: 0.45 + component.weight }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">{scoreT('note', lang)}</p>
          <button type="button" onClick={onClose} className="mt-3 min-h-11 rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-300">{scoreT('close', lang)}</button>
        </section>
  );
};

export const ScoreExplanation: React.FC<ScoreExplanationProps> = props => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <ScoreSummaryButton {...props} open={open} onToggle={() => setOpen(value => !value)} />
      {open && <ScoreExplanationPanel {...props} onClose={() => setOpen(false)} />}
    </div>
  );
};
