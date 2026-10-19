import React, { useRef } from 'react';
import { Clock3, RotateCcw, Sparkles } from 'lucide-react';
import type { LangCode } from '../../i18n';
import { uiT } from '../../i18nUi';
import { MAX_TIME_OFFSET_MINUTES, TIME_STEP_MINUTES, useTimeMachine } from '../../context/timeMachineCore';
import { selectionHaptic } from '../../utils/haptics';

const MARKERS = [0, 180, 360, 540, 720];

/**
 * TUR 2 — Gece Şeridi (Global Zaman Kadranı).
 *
 * Tek ofset tüm bağlı ekranları sürer. Her 15 dakikada bir dokunsal tık verir;
 * kaydırma sırasında ağır astronomi hesabı yapılmaz, yalnız imleç güncellenir.
 */
export const NightRibbon: React.FC<{
  lang: LangCode;
  timezone?: string;
  className?: string;
}> = ({ lang, timezone, className = '' }) => {
  const { now, instant, offsetMinutes, setOffsetMinutes, reset, isShifted } = useTimeMachine();
  const lastTickRef = useRef(0);

  const formatTime = (value: Date) => value.toLocaleTimeString(lang, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    setOffsetMinutes(next);
    const bucket = Math.floor(next / TIME_STEP_MINUTES);
    if (bucket !== lastTickRef.current) {
      lastTickRef.current = bucket;
      void selectionHaptic();
    }
  };

  return (
    <section className={`sv-panel p-4 sm:p-5 ${className}`.trim()} aria-label={uiT('time.title', lang)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <Sparkles className="h-4 w-4 shrink-0 text-indigo-300" aria-hidden="true" />
            {uiT('time.title', lang)}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">{uiT('time.hint', lang)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900/50 px-2.5 py-1.5 font-display text-sm font-semibold tabular-nums text-sky-200">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            {formatTime(instant)}
          </span>
          <button
            type="button"
            onClick={() => { reset(); void selectionHaptic(); }}
            disabled={!isShifted}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-xs font-semibold text-slate-300 transition-opacity disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {uiT('time.now', lang)}
          </button>
        </div>
      </header>

      <div className="mt-3">
        <input
          type="range"
          min={0}
          max={MAX_TIME_OFFSET_MINUTES}
          step={TIME_STEP_MINUTES}
          value={offsetMinutes}
          onChange={handleChange}
          aria-label={uiT('time.title', lang)}
          aria-valuetext={offsetMinutes === 0
            ? uiT('time.now', lang)
            : uiT('time.offset', lang).replace('{minutes}', String(offsetMinutes))}
          className="sv-range"
        />
        <div className="flex justify-between text-2xs font-medium text-slate-500">
          {MARKERS.map(marker => (
            <span key={marker} className="min-w-0">
              {marker === 0
                ? uiT('time.now', lang)
                : formatTime(new Date(now.getTime() + marker * 60_000))}
            </span>
          ))}
        </div>
      </div>

      {isShifted && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-200" role="status">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-300" aria-hidden="true" />
          {uiT('time.shifted', lang)} · {uiT('time.offset', lang).replace('{minutes}', String(offsetMinutes))}
        </p>
      )}
    </section>
  );
};
