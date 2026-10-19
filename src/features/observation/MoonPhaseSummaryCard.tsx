import React from 'react';
import { MoonPhaseInfo } from '../../types';
import { LangCode, t } from '../../i18n';
import { MoonRenderer } from '../astronomy/MoonRenderer';

interface MoonPhaseSummaryCardProps {
  moonPhase: MoonPhaseInfo;
  moonInfo: {
    name: string;
    desc: string;
  };
  lang: LangCode;
}

export const MoonPhaseSummaryCard: React.FC<MoonPhaseSummaryCardProps> = ({
  moonPhase,
  moonInfo,
  lang,
}) => (
  <div className="bg-gradient-to-br from-app-panel/90 to-app-panel/70 rounded-xl p-5 border border-white/5 flex flex-col sm:flex-row items-center sm:items-start gap-5 shadow-[0_8px_32px_rgba(30,27,75,0.4)]">
    <div className="shrink-0 w-28 h-28 bg-app-bg rounded-full flex items-center justify-center border border-white/5 shadow-[0_0_25px_rgba(99,102,241,0.3)] overflow-hidden">
      <MoonRenderer phaseType={moonPhase.phaseType} size={104} showGlow={true} />
    </div>
    <div className="flex-1 min-w-0 text-center sm:text-left">
      <span className="text-2xs uppercase font-semibold tracking-wider text-indigo-400">
        {t('obs.todayMoon', lang)}
      </span>
      <h4 className="text-base font-semibold text-white leading-tight mt-1 justify-center sm:justify-start flex items-center gap-1.5">
        {moonInfo.name} <span className="text-indigo-300 font-mono text-2xs bg-indigo-500/10 px-1.5 py-0.5 rounded">%{Math.round(moonPhase.fraction * 100)}</span>
      </h4>
      <p className="text-xs text-slate-400 mt-2 leading-relaxed select-none">
        {moonInfo.desc}
      </p>
    </div>
  </div>
);
