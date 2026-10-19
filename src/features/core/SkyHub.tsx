import React, { lazy, Suspense, useState } from 'react';
import { Camera, ChevronLeft, Image, Orbit, Satellite, Search, Sparkles } from 'lucide-react';
import { HourlyData } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { PageLoadingSkeleton } from '../../components/ui/Skeleton';
import { TonightTargets } from '../observation/TonightTargets';
import { selectionHaptic } from '../../utils/haptics';
import { useTimeMachine } from '../../context/timeMachineCore';
import { NightRibbon } from '../../components/ui/NightRibbon';
import { SkySearch } from '../sky/SkySearch';
import { uiT } from '../../i18nUi';

const ARSkyMap = lazy(() => import('../sky-map/ARSkyMap').then(module => ({ default: module.ARSkyMap })));
const ISSTracker = lazy(() => import('../satellites/ISSTracker').then(module => ({ default: module.ISSTracker })));
const NASAAPOD = lazy(() => import('../astronomy/NASAAPOD').then(module => ({ default: module.NASAAPOD })));
const SatelliteTracker = lazy(() => import('../satellites/SatelliteTracker').then(module => ({ default: module.SatelliteTracker })));

import { t } from '../../i18n';

type SkyTab = 'overview' | 'targets' | 'ar' | 'iss' | 'satellites' | 'apod';
const ROUTABLE_SKY_TABS: SkyTab[] = ['targets', 'ar', 'iss', 'satellites', 'apod'];

export const SkyHub: React.FC<{
  hourly: HourlyData | null;
  cloudCover: number;
}> = ({ hourly, cloudCover }) => {
  // F3.2: selector-based subscriptions — unrelated store writes no longer
  // re-render the hub shell.
  const lang = useAppStore(state => state.lang);
  const location = useAppStore(state => state.currentLocation);
  const currentRoute = useAppStore(state => state.currentRoute);
  const navigateToRoute = useAppStore(state => state.navigateToRoute);
  const goBack = useAppStore(state => state.goBack);
  const timeMachine = useTimeMachine();
  const [searchOpen, setSearchOpen] = useState(false);
  const tab = currentRoute.startsWith('sky:')
    ? currentRoute.slice('sky:'.length) as SkyTab
    : 'overview';
  const tabTargets = { tr: 'Hedefler', en: 'Targets', de: 'Ziele', fr: 'Cibles', es: 'Objetivos', ar: 'الأهداف', it: 'Obiettivi', pt: 'Alvos' }[lang] || 'Targets';
  const tabSatellites = { tr: 'Uydular', en: 'Satellites', de: 'Satelliten', fr: 'Satellites', es: 'Satélites', ar: 'الأقمار الصناعية', it: 'Satelliti', pt: 'Satélites' }[lang] || 'Satellites';
  const tools = [
    { id: 'targets' as const, label: tabTargets, description: t('skyhub.targetsDesc', lang), icon: Sparkles, tone: 'text-indigo-300 bg-indigo-500/10' },
    { id: 'ar' as const, label: 'AR', description: t('skyhub.arDesc', lang), icon: Camera, tone: 'text-sky-300 bg-sky-500/10' },
    { id: 'iss' as const, label: 'ISS', description: t('skyhub.issDesc', lang), icon: Satellite, tone: 'text-emerald-300 bg-emerald-500/10' },
    { id: 'satellites' as const, label: tabSatellites, description: t('skyhub.satellitesDesc', lang), icon: Orbit, tone: 'text-amber-300 bg-amber-500/10' },
    { id: 'apod' as const, label: 'NASA APOD', description: t('skyhub.apodDesc', lang), icon: Image, tone: 'text-rose-300 bg-rose-500/10' },
  ];
  const openTool = (destination: SkyTab) => {
    if (destination === 'overview' || !ROUTABLE_SKY_TABS.includes(destination)) navigateToRoute('sky');
    else navigateToRoute(`sky:${destination}` as const);
  };
  return (
    <div className="space-y-5">
      {tab === 'overview' ? <>
        <header><h1 className="text-xl font-semibold text-white">{t('skyhub.toolsTitle', lang)}</h1><p className="text-sm text-slate-400">{t('skyhub.toolsSubtitle', lang)}</p></header>
        <button
          type="button"
          onClick={() => { void selectionHaptic(); setSearchOpen(true); }}
          aria-label={uiT('search.open', lang)}
          className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-white/10 bg-slate-900/45 px-4 text-left text-sm text-slate-400"
        >
          <Search className="h-4 w-4 shrink-0 text-sky-300" aria-hidden="true" />
          <span className="min-w-0 truncate">{uiT('search.placeholder', lang)}</span>
        </button>
        <NightRibbon lang={lang} timezone={location.timezone} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{tools.map(tool => { const Icon = tool.icon; return <button key={tool.id} type="button" onClick={() => { void selectionHaptic(); openTool(tool.id); }} className="min-h-20 border-b border-white/10 px-2 py-4 flex items-center gap-4 text-left rtl:text-right"><span className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${tool.tone}`}><Icon className="w-5 h-5" /></span><span className="min-w-0"><span className="block font-semibold text-white">{tool.label}</span><span className="block text-sm text-slate-400">{tool.description}</span></span></button>; })}</div>
        <SkySearch
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          location={location}
          hourly={hourly}
          cloudCover={cloudCover}
          lang={lang}
        />
      </> : <button type="button" onClick={() => { if (!goBack()) navigateToRoute('sky'); }} className="min-h-11 inline-flex items-center gap-2 text-sm font-semibold text-indigo-300"><ChevronLeft className="w-4 h-4 rtl:rotate-180" />{t('skyhub.toolsTitle', lang)}</button>}
      <Suspense fallback={<PageLoadingSkeleton />}>
        {tab === 'targets' && <TonightTargets location={location} cloudCover={cloudCover} hourly={hourly} lang={lang} instantOverride={timeMachine.isShifted ? timeMachine.instant : undefined} />}
        {tab === 'ar' && <ARSkyMap hourly={hourly} />}
        {tab === 'iss' && <ISSTracker />}
        {tab === 'satellites' && <SatelliteTracker />}
        {tab === 'apod' && <NASAAPOD />}
      </Suspense>
    </div>
  );
};
