import React, { lazy, Suspense, useMemo, useState } from 'react';
import { AlertTriangle, CalendarPlus, CheckCircle, CircleHelp, Clock3, Eye, MapPin, Navigation, Share2, Sparkles, Telescope } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getMoonPhase, getVisiblePlanets } from '../../utils/astronomy';
import { PageLoadingSkeleton } from '../../components/ui/Skeleton';
import { getTargetName } from '../../utils/targetNames';
import { buildObservationScoreReport } from '../../utils/observationScore';
import { WeatherQueryData } from '../../hooks/queries/useWeatherQuery';
import { t } from '../../i18n';
import { uiT } from '../../i18nUi';
import { calculateDarknessWindow } from '../../utils/observationExperience';
import { DataFreshness } from '../../components/ui/DataFreshness';
import { useTonightTargets } from '../../hooks/useTonightTargets';
import { useObserverContext } from '../../hooks/useObserverContext';
import { useCountUp } from '../../hooks/useCountUp';
import { selectionHaptic } from '../../utils/haptics';
import { TonightTimeline } from '../observation/TonightTimeline';
import { ObservationWorkspace } from '../observation/ObservationWorkspace';
import { productT } from '../../i18nProduct';
import { ScoreExplanationPanel } from '../observation/ScoreExplanation';
import { NightRibbon } from '../../components/ui/NightRibbon';
import { useTimeMachine } from '../../context/timeMachineCore';
import { shareObservationCard } from '../../utils/shareCard';
import { showToast } from '../../store/toastStore';

const ObservationSuitability = lazy(() =>
  import('../observation/ObservationSuitability').then(module => ({ default: module.ObservationSuitability })));

export const TodayDashboard: React.FC<{
  observation: WeatherQueryData | null;
  loading: boolean;
  error: string | null;
  isOfflineData: boolean;
  onRefresh: () => void;
}> = props => {
  const lang = useAppStore(state => state.lang);
  const currentLocation = useAppStore(state => state.currentLocation);
  const fieldMode = useAppStore(state => state.fieldMode);
  const setFieldMode = useAppStore(state => state.setFieldMode);
  const navigateToRoute = useAppStore(state => state.navigateToRoute);
  const [scoreDetailsOpen, setScoreDetailsOpen] = useState(false);
  const timeMachine = useTimeMachine();
  const observation = props.observation;
  const baseObserver = useObserverContext(currentLocation);
  // TUR 2: Global Zaman Ekseni — tek imleç hedef listesi, karanlık pencere ve
  // skoru birlikte sürer; "şimdi"ye dönüldüğünde canlı saate döner.
  const observer = useMemo(
    () => timeMachine.isShifted ? { ...baseObserver, instant: timeMachine.instant } : baseObserver,
    [baseObserver, timeMachine.instant, timeMachine.isShifted],
  );
  const { targets } = useTonightTargets(
    observer,
    observation?.hourly ?? observation?.cloudCover ?? 50,
  );
  const moonInfo = useMemo(() => getMoonPhase(observer.instant, lang), [observer.instant, lang]);
  const scoreReport = useMemo(() => {
    const now = observer.instant;
    const planets = getVisiblePlanets(now, currentLocation.latitude, currentLocation.longitude);
    return buildObservationScoreReport({
      cloudCover: observation?.cloudCover ?? 100,
      windSpeed: observation?.windSpeed ?? 40,
      humidity: observation?.humidity ?? 100,
      bortleIndex: observation?.bortleIndex ?? 9,
      moonIllumination: moonInfo.fraction,
      visiblePlanetsCount: planets.length
    }, {
      fetchedAt: observation?.fetchedAt,
      offline: observation?.isOfflineCache,
      hasHourlyData: Boolean(observation?.hourly?.time?.length),
      bortleEstimated: true,
    });
  }, [observation, currentLocation, moonInfo.fraction, observer.instant]);
  const generalScore = scoreReport.profiles.general.score;
  const animatedScore = useCountUp(props.loading ? 0 : generalScore);
  const scoreToneClass = generalScore >= 70
    ? 'stroke-emerald-400'
    : generalScore >= 40
      ? 'stroke-amber-400'
      : 'stroke-rose-400';
  const SCORE_RING_RADIUS = 42;
  const scoreRingLength = 2 * Math.PI * SCORE_RING_RADIUS;
  const toggleScoreDetails = () => {
    void selectionHaptic();
    setScoreDetailsOpen(value => !value);
  };
  const goTo = (route: Parameters<typeof navigateToRoute>[0]) => {
    void selectionHaptic();
    navigateToRoute(route);
  };
  const handleShareCard = async () => {
    void selectionHaptic();
    const result = await shareObservationCard({
      dateLabel: localDate,
      locationName: currentLocation.name,
      windowHeading: uiT('share.windowHeading', lang),
      windowLabel: darknessWindow ? timeRange : uiT('hero.noWindowTitle', lang),
      score: generalScore,
      cloudLabel: uiT('share.cloud', lang).replace('{value}', String(Math.round(observation?.cloudCover ?? 0))),
      moonLabel: uiT('share.moon', lang).replace('{value}', String(Math.round(moonInfo.fraction * 100))),
      targetsHeading: uiT('share.targets', lang),
      targets: targets.slice(0, 3).map(target => getTargetName(target.id, lang)),
      footer: uiT('share.footer', lang),
    });
    if (result === 'failed') showToast(uiT('share.failed', lang), { variant: 'danger' });
    else if (result === 'downloaded') showToast(uiT('share.downloaded', lang), { variant: 'success' });
  };
  const warningMessages: Record<string, Record<string, string>> = {
    loading: { tr: 'Veriler hazırlanıyor', en: 'Preparing data', de: 'Daten werden vorbereitet', fr: 'Préparation des données', es: 'Preparando datos', ar: 'جاري تحضير البيانات', it: 'Preparazione dati', pt: 'Preparando dados' },
    cloud: { tr: 'Bulut örtüsü görüşü kısıtlayabilir.', en: 'Cloud cover may limit visibility.', de: 'Wolkendecke kann die Sicht einschränken.', fr: 'La couverture nuageuse peut limiter la visibilité.', es: 'La nubosidad puede limitar la visibilidad.', ar: 'قد يحد الغطاء السحابي من الرؤية.', it: 'La copertura nuvolosa può limitare la visibilità.', pt: 'A cobertura de nuvens pode limitar a visibilidade.' },
    wind: { tr: 'Rüzgâr teleskop kullanımını zorlaştırabilir.', en: 'Wind may affect telescope stability.', de: 'Wind kann die Teleskopstabilität beeinträchtigen.', fr: 'Le vent peut affecter la stabilité du télescope.', es: 'El viento puede afectar la estabilidad del telescopio.', ar: 'قد تؤثر الرياح على استقرار التلسكوب.', it: 'Il vento può influire sulla stabilità del telescopio.', pt: 'O vento pode afetar a estabilidade do telescópio.' },
    humidity: { tr: 'Yüksek nem merceklerde buğulanmaya yol açabilir.', en: 'High humidity may cause optics to fog.', de: 'Hohe Luftfeuchtigkeit kann Optiken beschlagen.', fr: 'Une humidité élevée peut embuer les optiques.', es: 'La alta humedad puede empañar las ópticas.', ar: 'قد تسبب الرطوبة العالية ضبابية العدسات.', it: "L'alta umidità può appannare le ottiche.", pt: 'A alta umidade pode embaçar as lentes.' },
    light: { tr: 'Yoğun ışık kirliliği sönük hedefleri gizleyebilir.', en: 'Heavy light pollution may hide faint targets.', de: 'Starke Lichtverschmutzung kann schwache Ziele verbergen.', fr: 'La pollution lumineuse peut masquer les cibles faibles.', es: 'La contaminación lumínica intensa puede ocultar objetos débiles.', ar: 'قد يخفي التلوث الضوئي الشديد الأهداف الخافتة.', it: "L'inquinamento luminoso intenso può nascondere obiettivi deboli.", pt: 'A poluição luminosa intensa pode esconder alvos fracos.' },
    clear: { tr: 'Belirgin bir gözlem engeli görünmüyor.', en: 'No major observing obstacle detected.', de: 'Keine größeren Beobachtungshindernisse erkannt.', fr: "Aucun obstacle majeur d'observation détecté.", es: 'No se detectaron obstáculos importantes para la observación.', ar: 'لم يتم اكتشاف عوائق رصد كبيرة.', it: 'Nessun ostacolo significativo rilevato.', pt: 'Nenhum obstáculo significativo detetado.' },
  };
  const warningKey = !observation ? 'loading' : observation.cloudCover > 55 ? 'cloud' : observation.windSpeed > 20 ? 'wind' : observation.humidity > 85 ? 'humidity' : observation.bortleIndex >= 8 ? 'light' : 'clear';
  const warning = !observation && props.error ? props.error : (warningMessages[warningKey]?.[lang] || warningMessages[warningKey]?.en || '');
  const isPositiveWarning = warningKey === 'clear';
  const darknessWindow = useMemo(() => calculateDarknessWindow(observer.instant, currentLocation, observation?.hourly, observation?.cloudCover ?? 100), [currentLocation, observation?.hourly, observation?.cloudCover, observer.instant]);
  const timeRange = darknessWindow
    ? `${darknessWindow.start.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', timeZone: currentLocation.timezone })}–${darknessWindow.end.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', timeZone: currentLocation.timezone })}`
    : t('today.noWindow', lang);
  const localDate = observer.instant.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long', timeZone: observer.timezone });

  return (
    <div className="space-y-5">
      <section className="sv-decision p-5 sm:p-6">
        <header className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm capitalize text-slate-400">{localDate}</p>
            <h1 className="text-xl font-semibold text-white break-words sm:text-2xl">{currentLocation.name}</h1>
          </div>
          <div className="flex max-w-full shrink-0 flex-wrap items-center justify-end gap-1.5 text-xs text-slate-400 sm:text-sm">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            {currentLocation.latitude.toFixed(2)}&deg;, {currentLocation.longitude.toFixed(2)}&deg;
          </div>
        </header>
        {observation && <DataFreshness className="mt-3" fetchedAt={observation.fetchedAt} source={observation.source} offline={observation.isOfflineCache} lang={lang} />}

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.55fr)] lg:items-center">
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-indigo-300">{uiT('hero.decision', lang)}</p>
            <p className="mt-1 text-sm font-medium text-slate-400">{darknessWindow ? uiT('hero.bestWindow', lang) : uiT('hero.noWindowTitle', lang)}</p>
            {darknessWindow ? (
              <p className="mt-1 flex min-w-0 items-center gap-2 break-words font-display text-3xl font-semibold tabular-nums text-sky-300 sm:text-4xl">
                <Clock3 className="h-6 w-6 shrink-0" aria-hidden="true" />
                <span className="min-w-0">{timeRange}</span>
              </p>
            ) : (
              <p className="mt-1 text-sm leading-relaxed text-slate-300">{uiT('hero.noWindowBody', lang)}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/45 px-2.5 py-1 text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-300" aria-hidden="true" />
                {uiT('hero.cloudLabel', lang)} %{Math.round(observation?.cloudCover ?? 0)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/45 px-2.5 py-1 text-slate-300">
                <CircleHelp className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                {darknessWindow?.moonBelowHorizon ? uiT('hero.moonDown', lang) : `${uiT('hero.moonUp', lang)} · %${Math.round(moonInfo.fraction * 100)}`}
              </span>
              {timeMachine.isShifted && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 font-medium text-indigo-200">
                  {uiT('hero.shiftedNotice', lang)}
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <button
                type="button"
                onClick={() => goTo('plan')}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30 transition-colors hover:bg-indigo-500"
              >
                <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                {uiT('hero.planNight', lang)}
              </button>
              <button
                type="button"
                onClick={() => goTo('sky:targets')}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/45 px-4 text-sm font-semibold text-slate-200"
              >
                <Telescope className="h-4 w-4" aria-hidden="true" />
                {uiT('hero.findSky', lang)}
              </button>
              <button
                type="button"
                onClick={() => goTo('sky:ar')}
                aria-label={uiT('hero.openAr', lang)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 text-sm font-semibold text-sky-200"
              >
                <Navigation className="h-4 w-4" aria-hidden="true" />
                <span className="sm:hidden lg:inline">AR</span>
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFieldMode(!fieldMode)}
                aria-pressed={fieldMode}
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${fieldMode ? 'border-rose-500/40 bg-rose-500/15 text-rose-300' : 'border-white/10 text-slate-300'}`}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                {fieldMode ? productT('field.on', lang) : productT('field.off', lang)}
              </button>
              <button
                type="button"
                onClick={() => { void handleShareCard(); }}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-300"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
                {uiT('share.button', lang)}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5 justify-self-center lg:justify-self-end">
            <button
              type="button"
              onClick={toggleScoreDetails}
              aria-expanded={scoreDetailsOpen}
              aria-controls="observation-score-details"
              className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              <svg viewBox="0 0 96 96" aria-hidden="true" className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="48" cy="48" r={SCORE_RING_RADIUS} fill="none" strokeWidth="7" className="stroke-white/10" />
                <circle
                  cx="48"
                  cy="48"
                  r={SCORE_RING_RADIUS}
                  fill="none"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={scoreRingLength}
                  strokeDashoffset={scoreRingLength * (1 - animatedScore / 100)}
                  className={scoreToneClass}
                />
              </svg>
              <span className="relative flex flex-col items-center leading-none">
                <span className="font-display text-3xl font-semibold tabular-nums text-white">
                  {props.loading ? '--' : Math.round(animatedScore)}
                </span>
                <span className="mt-0.5 text-base font-semibold text-slate-500">/100</span>
              </span>
            </button>
            <p className="inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-wide text-slate-500">
              {t('today.observationScore', lang)} · <CircleHelp className="h-3 w-3 shrink-0 text-indigo-300" />
              <span className="text-indigo-300">{uiT('hero.scoreHint', lang)}</span>
            </p>
          </div>
        </div>

        {scoreDetailsOpen && <ScoreExplanationPanel report={scoreReport} lang={lang} onClose={() => setScoreDetailsOpen(false)} />}

        <div className="mt-5 grid gap-3 border-t border-slate-700/45 pt-4 sm:grid-cols-2">
          <div className="flex gap-3">
            {isPositiveWarning ? <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />}
            <div><p className="text-sm font-medium text-white">{t('today.mainAlert', lang)}</p><p className="text-sm text-slate-400">{warning}</p></div>
          </div>
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" />
            <div><p className="text-sm font-medium text-white">{t('today.recommendedTarget', lang)}</p><p className="text-sm text-slate-400">{targets.slice(0, 3).map(target => getTargetName(target.id, lang)).join(' · ') || '---'}</p></div>
          </div>
        </div>
      </section>

      <NightRibbon lang={lang} timezone={currentLocation.timezone} />

      <Suspense fallback={<PageLoadingSkeleton />}>
        <ObservationSuitability
          observation={observation}
          loading={props.loading}
          error={props.error}
          onRefresh={props.onRefresh}
        />
      </Suspense>
      {observation && <TonightTimeline now={observer.instant} location={currentLocation} hourly={observation.hourly} cloudCover={observation.cloudCover} targets={targets} lang={lang} />}
      <ObservationWorkspace lang={lang} location={currentLocation} />
    </div>
  );
};
