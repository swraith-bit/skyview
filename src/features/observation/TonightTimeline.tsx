import React, { useEffect, useMemo, useState } from 'react';
import { Cloud, Moon, Sparkles } from 'lucide-react';
import { HourlyData, LocationData, TonightTarget } from '../../types';
import { buildSkyTimeline } from '../../utils/observationTimeline';
import { LangCode } from '../../i18n';
import { productT } from '../../i18nProduct';
import { getTargetName } from '../../utils/targetNames';
import { Panel } from '../../components/ui/Surface';
import { useCountUp } from '../../hooks/useCountUp';

export const TonightTimeline: React.FC<{
  now: Date;
  location: LocationData;
  hourly: HourlyData | null;
  cloudCover: number;
  targets: TonightTarget[];
  lang: LangCode;
}> = ({ now, location, hourly, cloudCover, targets, lang }) => {
  const points = useMemo(() => buildSkyTimeline(now, location.latitude, location.longitude, hourly, cloudCover, targets), [now, location, hourly, cloudCover, targets]);
  // noUncheckedIndexedAccess: best indeksi her zaman geçerli; sentinel yalnız tip için
  const bestIndex = useMemo(() => points.reduce((best, point, index) => point.score > (points[best]?.score ?? Number.NEGATIVE_INFINITY) ? index : best, 0), [points]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = points[selectedIndex ?? bestIndex];
  // F6.7: seçim/değişim sonrası bulut-ay yüzdeleri önceki görüntüden yumuşak sayar.
  const cloudDisplay = useCountUp(selected?.cloudCover ?? 0);
  const moonDisplay = useCountUp(selected?.moonIllumination ?? 0);
  // F4.2: rebuilt timeline means a held index no longer maps to the same hour; the
  // selection defers to "best" until the user picks one on the fresh data.
  useEffect(() => {
    setSelectedIndex(null);
  }, [points]);

  return (
    <Panel className="p-4 sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{productT('timeline.title', lang)}</h2>
          <p className="text-sm text-slate-400">{productT('timeline.subtitle', lang)}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          {productT('timeline.best', lang)} {points[bestIndex]?.time.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', timeZone: location.timezone })}
        </span>
      </header>
      <div className="mt-4 overflow-x-auto scrollbar-thin touch-pan-x" aria-label={productT('timeline.title', lang)}>
        <div className="grid min-w-[720px] grid-cols-12 gap-1.5 pb-2">
          {points.map((point, index) => {
            const height = Math.max(12, point.score * 0.64);
            const active = selected === point;
            return (
              <button key={point.time.toISOString()} type="button" onClick={() => setSelectedIndex(index)} className={`min-h-28 rounded-lg border px-1.5 py-2 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400 ${active ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/5 bg-slate-900/35'}`} aria-pressed={active} aria-label={`${point.time.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', timeZone: location.timezone })}, ${productT('timeline.score', lang)} ${point.score}, ${productT('timeline.cloud', lang)} %${Math.round(point.cloudCover)}, ${productT('timeline.moon', lang)} %${Math.round(point.moonIllumination)}`}>
                <span className="block text-xs text-slate-400">{point.time.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', timeZone: location.timezone })}</span>
                <span className="mt-2 flex h-16 items-end justify-center"><span className={`w-5 rounded-t ${point.score >= 70 ? 'bg-emerald-400' : point.score >= 45 ? 'bg-sky-400' : 'bg-amber-400'}`} style={{ height }} /></span>
                <span className="mt-1 block text-sm font-semibold text-white">{point.score}</span>
              </button>
            );
          })}
        </div>
      </div>
      {selected && (
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-center">
          <div><Sparkles className="mx-auto h-4 w-4 text-indigo-400" /><p className="mt-1 text-base font-semibold text-white">{selected.bestTargetId ? getTargetName(selected.bestTargetId, lang) : '---'}</p><p className="text-xs text-slate-500">{productT('timeline.score', lang)} {selected.score}</p></div>
          <div><Cloud className="mx-auto h-4 w-4 text-sky-400" /><p className="mt-1 text-base font-semibold text-white">%{Math.round(cloudDisplay)}</p><p className="text-xs text-slate-500">{productT('timeline.cloud', lang)}</p></div>
          <div><Moon className="mx-auto h-4 w-4 text-amber-300" /><p className="mt-1 text-base font-semibold text-white">%{Math.round(moonDisplay)}</p><p className="text-xs text-slate-500">{productT('timeline.moon', lang)}</p></div>
        </div>
      )}
    </Panel>
  );
};
