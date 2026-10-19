import React, { useMemo, useState } from 'react';
import { Eye, Search, Sparkles, Telescope, X } from 'lucide-react';
import type { HourlyData, LocationData, TonightTarget } from '../../types';
import type { LangCode } from '../../i18n';
import { uiT } from '../../i18nUi';
import { useTonightTargets } from '../../hooks/useTonightTargets';
import { useObserverContext } from '../../hooks/useObserverContext';
import { useTimeMachine } from '../../context/timeMachineCore';
import { useAppStore } from '../../store/useAppStore';
import { getTargetName } from '../../utils/targetNames';
import { StandardModal } from '../../components/ui/Modal';
import { CelestialObjectDetail } from '../observation/CelestialObjectDetail';
import { EmptyState } from '../../components/ui/EmptyState';

type SearchFilter = 'all' | 'above' | 'naked';

const altitudeNow = (target: TonightTarget, instant: Date): number => {
  if (!target.altitudePoints.length) return target.altitude;
  return target.altitudePoints.reduce((closest, point) => (
    Math.abs(point.time.getTime() - instant.getTime()) < Math.abs(closest.time.getTime() - instant.getTime())
      ? point
      : closest
  ), target.altitudePoints[0]!).altitude;
};

/**
 * TUR 2 — Spotlight Astro-Search.
 *
 * Başparmak hizasında tek dokunuşla açılan arama; "şu an ufkun üzerinde" ve
 * "çıplak göz" ön filtreleriyle listeyi daraltır. Sonuç seçimi doğrudan
 * çok duraklı detay çekmecesini açar.
 */
export const SkySearch: React.FC<{
  open: boolean;
  onClose: () => void;
  location: LocationData;
  hourly: HourlyData | null;
  cloudCover: number;
  lang: LangCode;
}> = ({ open, onClose, location, hourly, cloudCover, lang }) => {
  const navigateToRoute = useAppStore(state => state.navigateToRoute);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [detailTarget, setDetailTarget] = useState<TonightTarget | null>(null);
  const timeMachine = useTimeMachine();
  const observer = useObserverContext(location);
  const shiftedObserver = useMemo(() => ({ ...observer, instant: timeMachine.instant }), [observer, timeMachine.instant]);
  const { targets, loading } = useTonightTargets(shiftedObserver, hourly ?? cloudCover);

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(lang);
    return targets.filter(target => {
      const matchesQuery = !normalized || getTargetName(target.id, lang).toLocaleLowerCase(lang).includes(normalized) || target.id.includes(normalized);
      if (!matchesQuery) return false;
      if (filter === 'above') return altitudeNow(target, timeMachine.instant) >= 10;
      if (filter === 'naked') return target.equipment.includes('naked-eye');
      return true;
    });
  }, [targets, query, filter, lang, timeMachine.instant]);

  const filters: Array<{ id: SearchFilter; label: string }> = [
    { id: 'all', label: uiT('search.all', lang) },
    { id: 'above', label: uiT('search.above', lang) },
    { id: 'naked', label: uiT('search.naked', lang) },
  ];

  return (
    <>
      <StandardModal
        open={open}
        onClose={onClose}
        variant="center"
        ariaLabel={uiT('search.title', lang)}
        closeOnBackdrop
        panelClassName="w-full max-w-lg max-h-[82vh] border-white/10 bg-app-surface"
      >
        <header className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-sky-300" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={uiT('search.placeholder', lang)}
            aria-label={uiT('search.placeholder', lang)}
            className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
          />
          <button type="button" onClick={onClose} aria-label={uiT('search.close', lang)} className="sv-icon-button shrink-0 text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex flex-wrap gap-2 border-b border-white/5 px-4 py-2.5" role="tablist">
          {filters.map(item => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={`min-h-9 rounded-full border px-3 text-xs font-semibold ${filter === item.id ? 'border-sky-400/50 bg-sky-500/15 text-sky-200' : 'border-white/10 text-slate-400'}`}
            >
              {item.label}
            </button>
          ))}
          <span className="ms-auto self-center text-2xs text-slate-500">{uiT('search.results', lang).replace('{count}', String(results.length))}</span>
        </div>

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
          {loading && [0, 1, 2, 3].map(index => (
            <div key={index} className="h-14 animate-pulse rounded-lg border border-white/5 bg-slate-900/40" />
          ))}
          {!loading && results.map(target => (
            <button
              key={target.id}
              type="button"
              onClick={() => setDetailTarget(target)}
              className="flex w-full min-h-14 items-center gap-3 rounded-lg border border-white/5 bg-slate-900/40 px-3 py-2 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
                {target.equipment.includes('naked-eye') ? <Eye className="h-4 w-4" /> : <Telescope className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">{getTargetName(target.id, lang)}</span>
                <span className="block text-xs text-slate-400">
                  {altitudeNow(target, timeMachine.instant).toFixed(0)}° · {target.bestTime.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', timeZone: location.timezone })}
                </span>
              </span>
              <span className="shrink-0 font-display text-sm font-semibold text-sky-300">{target.score}</span>
            </button>
          ))}
          {!loading && results.length === 0 && (
            <EmptyState icon={Sparkles} message={uiT('search.empty', lang)} />
          )}
        </div>
      </StandardModal>

      {detailTarget && (
        <CelestialObjectDetail
          target={detailTarget}
          location={location}
          lang={lang}
          onClose={() => setDetailTarget(null)}
          onOpenAr={() => { setDetailTarget(null); onClose(); navigateToRoute('sky:ar'); }}
        />
      )}
    </>
  );
};
