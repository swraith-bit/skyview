import React from 'react';
import { Droplets, Lightbulb, Thermometer, Wind } from 'lucide-react';
import { ObservationData } from '../../types';
import { LangCode, t } from '../../i18n';
import { getBortleInfo } from '../../utils/bortle';

interface WeatherMetricsGridProps {
  observation: ObservationData;
  lang: LangCode;
}

export const WeatherMetricsGrid: React.FC<WeatherMetricsGridProps> = ({
  observation,
  lang,
}) => {
  const bortleInfo = getBortleInfo(observation.bortleIndex, lang);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
      <div className="bg-slate-900/40 rounded-xl p-3 md:p-4 border border-slate-700/45 flex flex-col items-center text-center justify-center min-h-[110px]">
        <Thermometer className="w-5 h-5 text-slate-500 mb-1" />
        <span className="text-2xs md:text-xs text-slate-400 font-semibold uppercase leading-tight mb-1">{t('obs.temp', lang)}</span>
        <span className="text-sm font-semibold text-white">{observation.temp}&deg;C</span>
      </div>
      <div className="bg-slate-900/40 rounded-xl p-3 md:p-4 border border-slate-700/45 flex flex-col items-center text-center justify-center min-h-[110px]">
        <Droplets className="w-5 h-5 text-slate-500 mb-1" />
        <span className="text-2xs md:text-xs text-slate-400 font-semibold uppercase leading-tight mb-1">{t('obs.humidity', lang)}</span>
        <span className="text-sm font-semibold text-white">%{observation.humidity}</span>
      </div>
      <div className="bg-slate-900/40 rounded-xl p-3 md:p-4 border border-slate-700/45 flex flex-col items-center text-center justify-center min-h-[110px]">
        <Wind className="w-5 h-5 text-slate-500 mb-1" />
        <span className="text-2xs md:text-xs text-slate-400 font-semibold uppercase leading-tight mb-1">{t('obs.wind', lang)}</span>
        <span className="text-sm font-semibold text-white">{observation.windSpeed} km/h</span>
      </div>
      <div className="bg-gradient-to-br from-indigo-950 to-slate-950 rounded-xl p-3 md:p-4 border border-slate-700/45 flex flex-col items-center text-center justify-center min-h-[110px]" title={t('obs.lightPollutionDesc', lang)}>
        <Lightbulb className="w-5 h-5 text-yellow-500 mb-1" />
        <span className="text-2xs md:text-xs text-slate-400 font-semibold uppercase leading-tight mb-1">{t('obs.bortleEstimate', lang)}</span>
        <span className="text-sm font-black text-indigo-300">Class {observation.bortleIndex}</span>
        <span className="text-3xs text-slate-500 font-medium">({t('obs.estimated', lang)})</span>
        <span className={`text-2xs font-semibold tracking-wide uppercase mt-1 ${bortleInfo.color}`}>
          {bortleInfo.rating}
        </span>
        <span className="text-3xs text-slate-500 font-medium mt-0.5 leading-none max-w-[120px] line-clamp-2">
          {bortleInfo.desc}
        </span>
      </div>
    </div>
  );
};
