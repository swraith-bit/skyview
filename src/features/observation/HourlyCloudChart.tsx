import React, { useEffect, useState } from 'react';
import { HourlyData } from '../../types';
import { LangCode, t } from '../../i18n';

interface HourlyCloudChartProps {
  hourly: HourlyData;
  lang: LangCode;
  timezone?: string;
}

const getHourlyAdvice = (cloud: number, wind: number, lang: LangCode) => {
  if (cloud <= 15 && wind <= 15) {
    return t('obs.adviceExcellent', lang);
  }
  if (cloud <= 45 && wind <= 25) {
    return t('obs.adviceGood', lang);
  }
  if (cloud <= 65) {
    return t('obs.adviceLimited', lang);
  }
  return t('obs.adviceOvercast', lang);
};

export const HourlyCloudChart: React.FC<HourlyCloudChartProps> = ({
  hourly,
  lang,
  timezone,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  // F4.2: a refresh swaps the hourly array around; a stale index would surface the
  // wrong hour's advice, so hover state resets on data-identity change.
  useEffect(() => {
    setHoveredIndex(null);
  }, [hourly]);
  const dataPoints = hourly.cloudCover;
  const timePoints = hourly.time;
  const currentTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (!dataPoints || dataPoints.length === 0) return null;

  return (
    <div className="w-full mt-4 space-y-4">
      <div className="min-h-[60px] bg-slate-900/70 border border-white/10 backdrop-blur-xl rounded-xl p-3 flex items-center justify-between gap-4 transition-all duration-300 select-none">
        {hoveredIndex !== null ? (
          (() => {
            const cloud = dataPoints[hoveredIndex] ?? 0;
            const wind = hourly.windspeed[hoveredIndex] ?? 0;
            const ts = timePoints[hoveredIndex];
            if (ts === undefined) return null; // noUncheckedIndexedAccess: stale hover indeksi guard
            const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
            const timeStr = d.toLocaleTimeString(lang, {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: currentTimezone,
            });
            return (
              <>
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="text-3xs font-black text-indigo-400 uppercase tracking-widest">{timeStr} {t('obs.forecast', lang)}</span>
                  <p className="text-xs-plus font-medium text-slate-200 leading-snug">{getHourlyAdvice(cloud, wind, lang)}</p>
                </div>
                <div className="flex gap-4 shrink-0 font-mono text-xs-plus">
                  <div className="flex flex-col items-center">
                    <span className="text-4xs font-semibold text-slate-500 uppercase">{t('obs.cloud', lang)}</span>
                    <span className={`font-black ${cloud <= 40 ? 'text-emerald-400' : 'text-rose-500'}`}>%{cloud.toFixed(0)}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-4xs font-semibold text-slate-500 uppercase">{t('obs.windLabel', lang)}</span>
                    <span className="font-black text-slate-300">{wind.toFixed(0)} km/h</span>
                  </div>
                </div>
              </>
            );
          })()
        ) : (
          <div className="w-full text-center text-slate-500 text-2xs font-semibold uppercase tracking-wider py-1.5">
            {t('obs.chartHint', lang)}
          </div>
        )}
      </div>

      <div className="w-full max-w-full bg-slate-900/40 p-3 rounded-xl border border-white/10 overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-smooth touch-auto scrollbar-thin">
        <div className="flex items-end justify-between gap-1.5 xs:gap-2 sm:gap-3 min-w-max pb-1">
          {dataPoints.map((cloudCover, index) => {
            const ts = timePoints[index];
            if (ts === undefined) return null; // noUncheckedIndexedAccess: diziler hizalı; eksik örnek → nokta yok
            const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
            const timeStr = d.toLocaleTimeString(lang, {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: currentTimezone,
            });
            const isGood = cloudCover <= 40;
            const height = Math.max(cloudCover, 6);
            const isHovered = hoveredIndex === index;

            return (
              <button
                type="button"
                key={`${ts}-${index}`}
                aria-label={`${timeStr} — ${t('obs.cloud', lang)} %${cloudCover.toFixed(0)}`}
                aria-pressed={isHovered}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(hoveredIndex === index ? null : index)}
                className={`flex flex-col items-center gap-1.5 group w-[24px] xs:w-[28px] sm:w-[32px] md:w-[36px] shrink-0 snap-start cursor-pointer transition-transform duration-200 ${isHovered ? 'scale-105' : ''}`}
              >
                <span className={`text-4xs xs:text-3xs md:text-2xs font-semibold mb-0.5 transition-colors ${isHovered ? 'text-indigo-400 scale-110' : 'text-white'}`}>
                  %{cloudCover.toFixed(0)}
                </span>
                <div className={`w-full bg-slate-900 rounded-lg h-20 flex items-end overflow-hidden shadow-inner border transition-all duration-300 ${isHovered ? 'border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.3)]' : 'border-slate-700/45'}`}>
                  <div
                    className={`w-full rounded-b-sm transition-all duration-500 ${isGood ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]'} ${isHovered ? 'brightness-110' : ''}`}
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  />
                </div>
                <span className={`text-4xs xs:text-3xs font-mono font-medium transition-colors ${isHovered ? 'text-indigo-400 font-semibold' : 'text-slate-500'}`}>{timeStr}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
