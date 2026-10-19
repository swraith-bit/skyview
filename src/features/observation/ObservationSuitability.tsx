import React, { useState, useEffect, useMemo, useRef, lazy } from 'react';
import { LocationData, ObservationData } from '../../types';
import { MapPin, Search, CheckCircle, AlertTriangle, Loader2, Lightbulb, ExternalLink, RefreshCw } from 'lucide-react';
import { LangCode, t } from '../../i18n';
import { getMoonPhaseForLocalDate } from '../../utils/astronomy';

const LightPollutionMap = lazy(() => import('./LightPollutionMap').then(m => ({ default: m.LightPollutionMap })));
import { StandardModal } from '../../components/ui/Modal';
import { Geolocation } from '@capacitor/geolocation';
import { PanelLoadingSkeleton } from '../../components/ui/Skeleton';
import { useAppStore } from '../../store/useAppStore';
import { useObserverContext } from '../../hooks/useObserverContext';
import { AuroraForecast } from './AuroraForecast';
import { getBortleInfo } from '../../utils/bortle';
import { HourlyCloudChart } from './HourlyCloudChart';
import { MoonPhaseSummaryCard } from './MoonPhaseSummaryCard';
import { WeatherMetricsGrid } from './WeatherMetricsGrid';
import { getCurrentLocationFallbackName, resolveLocationName } from '../../utils/locationName';
import { resolveTimezoneForCoordinates } from '../../utils/locationTimezone';
import { searchLocations } from '../../services/geocodingService';

const moonPhaseDescriptions: Record<LangCode, Record<string, string>> = {
 en: {
  'new-moon': 'The darkest nights are ideal for the Milky Way and faint deep-sky targets.', 'waxing-crescent': 'Visible in the early evening; the terminator reveals crater shadows well.', 'first-quarter': 'Half illuminated and well placed for detailed crater observation.', 'waxing-gibbous': 'Bright moonlight limits faint targets, but lunar surface features remain clear.', 'full-moon': 'Strong moonlight washes out faint stars; it is best suited to lunar viewing.', 'waning-gibbous': 'Rises later, leaving the first part of the evening darker for deep-sky targets.', 'last-quarter': 'Best seen toward morning, with a dark sky during the evening hours.', 'waning-crescent': 'A slim dawn crescent that leaves most of the night dark for observation.',
 },
 tr: {
  'new-moon': 'En karanlık geceler Samanyolu ve sönük derin uzay hedefleri için idealdir.', 'waxing-crescent': 'Akşam erken görünür; aydınlık-karanlık sınırı krater gölgelerini belirginleştirir.', 'first-quarter': 'Yarı aydınlıktır ve ayrıntılı krater gözlemi için uygundur.', 'waxing-gibbous': 'Parlak ay ışığı sönük hedefleri zorlaştırır ancak yüzey ayrıntıları nettir.', 'full-moon': 'Güçlü ay ışığı sönük yıldızları bastırır; Ay gözlemi için uygundur.', 'waning-gibbous': 'Daha geç doğar ve akşamın ilk bölümünü derin uzay gözlemi için karanlık bırakır.', 'last-quarter': 'Sabaha doğru iyi görünür; akşam saatlerinde gökyüzü daha karanlıktır.', 'waning-crescent': 'Şafakta görülen ince hilal, gecenin büyük bölümünü gözlem için karanlık bırakır.',
 },
 de: {
  'new-moon': 'Die dunkelsten Nächte sind ideal für Milchstraße und schwache Deep-Sky-Ziele.', 'waxing-crescent': 'Früh am Abend sichtbar; der Terminator zeigt Kraterschatten deutlich.', 'first-quarter': 'Halb beleuchtet und günstig für detailreiche Kraterbeobachtung.', 'waxing-gibbous': 'Helles Mondlicht stört schwache Ziele, Oberflächendetails bleiben klar.', 'full-moon': 'Starkes Mondlicht überstrahlt schwache Sterne; ideal für Mondbeobachtung.', 'waning-gibbous': 'Geht später auf und lässt den frühen Abend dunkler.', 'last-quarter': 'Am besten morgens sichtbar; der Abendhimmel bleibt dunkel.', 'waning-crescent': 'Eine schmale Morgensichel, die den Großteil der Nacht dunkel lässt.',
 },
 fr: {
  'new-moon': 'Les nuits les plus sombres sont idéales pour la Voie lactée et le ciel profond.', 'waxing-crescent': 'Visible tôt le soir, le terminateur révèle bien les ombres des cratères.', 'first-quarter': 'À moitié éclairée et bien placée pour observer les cratères.', 'waxing-gibbous': 'La lumière gêne les cibles faibles, mais les détails lunaires restent nets.', 'full-moon': 'La forte lumière masque les étoiles faibles ; privilégiez la Lune.', 'waning-gibbous': 'Se lève plus tard et laisse le début de soirée plus sombre.', 'last-quarter': 'Mieux visible le matin, avec un ciel sombre en soirée.', 'waning-crescent': 'Un fin croissant à l’aube qui laisse la majeure partie de la nuit sombre.',
 },
 es: {
  'new-moon': 'Las noches más oscuras son ideales para la Vía Láctea y objetos débiles.', 'waxing-crescent': 'Visible al inicio de la noche; el terminador resalta los cráteres.', 'first-quarter': 'Iluminada a la mitad y favorable para observar cráteres.', 'waxing-gibbous': 'La luz dificulta objetos débiles, pero los detalles lunares siguen claros.', 'full-moon': 'La luz intensa oculta estrellas débiles; es mejor observar la Luna.', 'waning-gibbous': 'Sale más tarde y deja más oscuro el comienzo de la noche.', 'last-quarter': 'Se ve mejor por la mañana y deja oscura la tarde-noche.', 'waning-crescent': 'Un fino creciente al amanecer que mantiene oscura gran parte de la noche.',
 },
 ar: {
  'new-moon': 'الليالي الأشد ظلمة مثالية لدرب التبانة وأجرام السماء العميقة الخافتة.', 'waxing-crescent': 'يظهر أول المساء وتُبرز منطقة الفاصل ظلال الفوهات.', 'first-quarter': 'نصفه مضاء ومناسب لرصد تفاصيل الفوهات.', 'waxing-gibbous': 'يحد ضوء القمر من الأهداف الخافتة لكن تفاصيل السطح تبقى واضحة.', 'full-moon': 'يحجب الضوء القوي النجوم الخافتة وهو أنسب لرصد القمر.', 'waning-gibbous': 'يشرق متأخرًا ويترك بداية المساء أكثر ظلمة.', 'last-quarter': 'يُرى أفضل صباحًا مع بقاء سماء المساء مظلمة.', 'waning-crescent': 'هلال رفيع عند الفجر يترك معظم الليل مظلمًا للرصد.',
 },
 it: {
  'new-moon': 'Le notti più buie sono ideali per Via Lattea e oggetti deboli.', 'waxing-crescent': 'Visibile in prima serata; il terminatore evidenzia le ombre dei crateri.', 'first-quarter': 'Illuminata a metà e favorevole all’osservazione dei crateri.', 'waxing-gibbous': 'La luce limita gli oggetti deboli, ma i dettagli lunari restano chiari.', 'full-moon': 'La luce intensa nasconde le stelle deboli; è ideale per osservare la Luna.', 'waning-gibbous': 'Sorge più tardi e lascia più buia la prima parte della sera.', 'last-quarter': 'Si osserva meglio al mattino, con il cielo serale più scuro.', 'waning-crescent': 'Una sottile falce all’alba che lascia buia gran parte della notte.',
 },
 pt: {
  'new-moon': 'As noites mais escuras são ideais para a Via Láctea e alvos ténues.', 'waxing-crescent': 'Visível no início da noite; o terminador destaca as sombras das crateras.', 'first-quarter': 'Metade iluminada e favorável à observação detalhada das crateras.', 'waxing-gibbous': 'A luz dificulta alvos ténues, mas os detalhes lunares continuam nítidos.', 'full-moon': 'A luz forte apaga estrelas ténues; é melhor para observar a Lua.', 'waning-gibbous': 'Nasce mais tarde e deixa o início da noite mais escuro.', 'last-quarter': 'Vê-se melhor de manhã, mantendo o céu da noite mais escuro.', 'waning-crescent': 'Um crescente fino ao amanhecer que deixa a maior parte da noite escura.',
 },
};

const getMoonPhaseDetails = (phaseType: string, lang: LangCode): { name: string; desc: string } => ({
 name: t(`moon.phases.${phaseType}`, lang),
 // noUncheckedIndexedAccess: sözlük 8 faz için tam; eksikse boş UI metni
 desc: moonPhaseDescriptions[lang]?.[phaseType] || moonPhaseDescriptions.en[phaseType] || '',
});

interface SuitabilityProps {
  observation: ObservationData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}


export const ObservationSuitability: React.FC<SuitabilityProps> = ({
  observation,
  loading,
  error,
  onRefresh,
}) => {
  // F3.2: selector-based subscriptions — unrelated store writes no longer
  // re-render the suitability form.
  const lang = useAppStore(state => state.lang);
  const currentLocation = useAppStore(state => state.currentLocation);
  const onLocationChange = useAppStore(state => state.setCurrentLocation);
  const setLocationSource = useAppStore(state => state.setLocationSource);
  const observer = useObserverContext(currentLocation);
 const [isMapOpen, setIsMapOpen] = useState<boolean>(false);

 const [searchQuery, setSearchQuery] = useState<string>('');
 const [searchResults, setSearchResults] = useState<LocationData[]>([]);
 const [searchLoading, setSearchLoading] = useState<boolean>(false);
 const [showDropdown, setShowDropdown] = useState<boolean>(false);
 const [geoState, setGeoState] = useState<'idle' | 'prompting'>('idle');
 // F4.2: tags which query returned the current results — Enter must not apply a
 // previous query's first hit while a new (or pending) SearchQuery is unresolved.
 const resultsForQueryRef = useRef<string>('');

 const todayMoon = useMemo(() => {
 return getMoonPhaseForLocalDate(observer.instant, lang, observer.timezone);
 }, [lang, observer.instant, observer.timezone]);

 const moonInfo = useMemo(() => {
 return getMoonPhaseDetails(todayMoon.phaseType, lang);
 }, [todayMoon, lang]);

 useEffect(() => {
 let active = true;
 let activeController: AbortController | null = null;
 if (!searchQuery.trim()) {
 setSearchResults([]);
 setShowDropdown(false);
 resultsForQueryRef.current = '';
 return;
 }
 
 // Don't auto-search if the query is just what they selected (we'd need a selected state, but checking dropdown state might be enough, or we just let it run)
 const delayDebounceFn = setTimeout(async () => {
 setSearchLoading(true); setShowDropdown(true);
 const controller = new AbortController();
 activeController = controller;
 const timeoutId = setTimeout(() => controller.abort(), 8000);
 try {
 const results = await searchLocations(searchQuery, lang, controller.signal, 6);
 if (!active) return;
 resultsForQueryRef.current = searchQuery;
 setSearchResults(results);
 } catch {
 if (active) {
 resultsForQueryRef.current = '';
 setSearchResults([]);
 }
 } finally {
 clearTimeout(timeoutId);
 if (active) setSearchLoading(false);
 }
 }, 400);

 return () => {
 active = false;
 clearTimeout(delayDebounceFn);
 activeController?.abort();
 };
 }, [searchQuery, lang]);

 const handleSearch = async (e: React.FormEvent) => {
 e.preventDefault();
 const query = searchQuery.trim();
 if (!query || searchResults.length === 0) return;
 // F4.2: skip while a fresh search is in flight, and skip results tagged with an
 // older query (debounce pending) — Enter must never apply a stale first hit.
 if (searchLoading || resultsForQueryRef.current !== query) return;
 // Select the first result on Enter
 const firstResult = searchResults[0];
 if (!firstResult) return; // noUncheckedIndexedAccess: liste boş değil (yukarıda kontrol edildi)
 onLocationChange(firstResult);
 setLocationSource('manual');
 setShowDropdown(false);
 setSearchQuery('');
 resultsForQueryRef.current = '';
 };

 const requestBrowserLocation = async () => {
 setGeoState('prompting');
 try {
 const permission = await Geolocation.checkPermissions();
 if (permission.location !== 'granted') {
 const req = await Geolocation.requestPermissions();
 if (req.location !== 'granted') {
 setGeoState('idle');
 return;
 }
 }
 
 const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 });
 setGeoState('idle');
 const latitude = Number(pos.coords.latitude.toFixed(4));
 const longitude = Number(pos.coords.longitude.toFixed(4));
 const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
 onLocationChange({
 name: getCurrentLocationFallbackName(lang),
 latitude,
 longitude,
 timezone,
 });
 setLocationSource('gps');
 void resolveTimezoneForCoordinates(latitude, longitude).then(timezone => {
  const selectedLocation = useAppStore.getState().currentLocation;
  if (selectedLocation.latitude !== latitude || selectedLocation.longitude !== longitude) return;
  if (selectedLocation.timezone === timezone) return;
  onLocationChange({ ...selectedLocation, timezone });
 });
 void resolveLocationName(latitude, longitude, lang).then(name => {
 const selectedLocation = useAppStore.getState().currentLocation;
 if (selectedLocation.latitude !== latitude || selectedLocation.longitude !== longitude) return;
 onLocationChange({ ...selectedLocation, name });
 });
 } catch (err) {
 setGeoState('idle');
 console.warn('Geolocation Error:', err);
 }
 };
 return (
 <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 py-3 lg:py-6">
 
 <div className="lg:col-span-5 flex flex-col space-y-5">
 <form onSubmit={handleSearch} className="relative z-20">
 <div className="flex gap-2">
 <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setShowDropdown(false); }}
 placeholder={t('obs.searchPlaceholder', lang)} aria-label={t('obs.searchPlaceholder', lang)} className="w-full bg-app-panel text-white px-4 py-3 rounded-xl border border-white/5 text-sm focus:border-indigo-500 hover:border-white/5 outline-none transition" />
 <button type="submit" disabled={searchLoading} aria-label={t('obs.searchBtn', lang)} className="px-4 py-3 bg-indigo-900/20 hover:bg-indigo-900/40 border border-white/5 text-indigo-300 rounded-xl font-semibold text-sm transition-colors">
 {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
 </button>
 </div>
 {/* Dropdown */}
 {showDropdown && searchResults.length > 0 && (
 <div className="absolute top-full left-0 right-0 mt-2 bg-app-panel-raised border border-white/5 rounded-xl shadow-sm z-30 overflow-hidden">
 {searchResults.map((res, i) => (
 <button key={i} type="button" onClick={() => { onLocationChange(res); setLocationSource('manual'); setShowDropdown(false); setSearchQuery(''); }}
 className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-indigo-600/20 flex gap-2 border-b border-white/5 last:border-0 transition-colors">
 <MapPin className="w-4 h-4 text-indigo-400" /> {res.name}
 </button>
 ))}
 </div>
 )}
 </form>

 <button onClick={requestBrowserLocation} disabled={geoState === 'prompting'}
 className="w-full py-3 px-4 rounded-xl font-semibold text-xs flex justify-center gap-2 border bg-indigo-600/10 text-indigo-400 border-white/5 hover:bg-indigo-600/20 hover:border-white/5 transition-all outline-none">
 {geoState === 'prompting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
 {geoState === 'prompting' ? t('obs.gettingLocation', lang) : t('obs.useLocation', lang)}
 </button>

 <MoonPhaseSummaryCard moonPhase={todayMoon} moonInfo={moonInfo} lang={lang} />

 </div>

 <div className="lg:col-span-7 flex flex-col justify-center">
 {loading ? (
 <PanelLoadingSkeleton />
 ) : error ? (
  <div className="flex flex-col items-center gap-3 text-center p-8 bg-rose-500/10 rounded-xl border border-rose-500/30 text-rose-300">
  <AlertTriangle className="w-5 h-5 text-rose-400" />
  <p className="text-sm">{error}</p>
  <button type="button" onClick={onRefresh} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-400/30 px-3 text-xs font-semibold text-rose-200">
  <RefreshCw className="w-3.5 h-3.5" />
  {t('apod.refresh', lang)}
  </button>
  </div>
 ) : observation ? (
 <div className={`p-6 md:p-8 rounded-xl border transition-colors ${observation.colorTheme === 'green' ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-800/30 border-rose-500/30'}`}>
 <div className="flex justify-between items-start mb-6">
 <div className="flex flex-col gap-0.5">
  <h3 className="text-lg font-semibold flex items-center gap-1.5 font-display"><MapPin className="w-4 h-4 text-indigo-400" /> {currentLocation.name.split('(')[0]}</h3>
 <span className="text-xs font-mono text-slate-500 ml-5 flex items-center gap-1.5">
 {currentLocation.latitude.toFixed(4)}°, {currentLocation.longitude.toFixed(4)}°
 <a
 href={`https://www.google.com/maps/search/?api=1&query=${currentLocation.latitude},${currentLocation.longitude}`}
 target="_blank"
 rel="noopener noreferrer"
 className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center"
 title={t('obs.openInGoogleMaps', lang)}
 >
 <ExternalLink className="w-3 h-3" />
 </a>
 </span>
 </div>
 <div className={`px-3 py-1.5 rounded-full text-2xs font-black flex items-center gap-1.5 ${observation.colorTheme === 'green' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
 {observation.colorTheme === 'green' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
 {observation.colorTheme === 'green' ? t('obs.suitableBadge', lang) : t('obs.unsuitableBadge', lang)}
 </div>
 </div>

 <div className="flex items-center gap-6 mb-6">
 {/* Massive Percent Visual */}
 <div className="relative shrink-0 flex items-center justify-center">
 <svg className="w-24 h-24 transform -rotate-90">
 <circle cx="48" cy="48" r="40" className="stroke-slate-800/80 fill-none" strokeWidth="6" />
 <circle cx="48" cy="48" r="40" className={`fill-none transition-all duration-1000 ${observation.colorTheme === 'green' ? 'stroke-emerald-400' : 'stroke-rose-400'}`}
 strokeWidth="6" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - observation.cloudCover / 100)} strokeLinecap="round" />
 </svg>
 <div className="absolute flex flex-col items-center">
 <span className="text-2xl font-black text-white">%{observation.cloudCover}</span>
 </div>
 </div>
 <div>
 <p className={`font-semibold mb-1 ${observation.colorTheme === 'green' ? 'text-emerald-300' : 'text-rose-300'}`}>
 {observation.suitability === 'excellent' ? t('obs.statusExcellent', lang) : 
 observation.suitability === 'good' ? t('obs.statusGood', lang) :
 observation.suitability === 'fair' ? t('obs.statusFair', lang) :
 observation.suitability === 'poor' ? t('obs.statusPoor', lang) :
 t('obs.statusUnsuitable', lang)}
 </p>
 </div>
 </div>

 <WeatherMetricsGrid observation={observation} lang={lang} />

 {/* Visual Bortle Scale Indicator & Observable Objects Card */}
 <div className="bg-slate-950/35 border border-slate-700/50 rounded-xl p-5 mb-6 flex flex-col md:flex-row items-center gap-5">
 <div className="flex-1">
 <span className="text-3xs font-semibold text-indigo-400 uppercase tracking-widest block mb-1 select-none">
 {t('obs.obsQuality', lang)}
 </span>
 <h4 className="text-sm font-semibold text-white flex items-center gap-2">
 <Lightbulb className="w-4 h-4 text-yellow-400" />
  {t('obs.bortleEstimate', lang)} {observation.bortleIndex} — {getBortleInfo(observation.bortleIndex, lang).rating}
 </h4>
 <p className="text-xs-plus text-slate-400 mt-2 leading-relaxed select-none">
  {getBortleInfo(observation.bortleIndex, lang).desc}.{' '}
 {Math.round(observation.bortleIndex) <= 2 
 ? t('obs.bortleDetails1', lang)
 : Math.round(observation.bortleIndex) <= 4 
 ? t('obs.bortleDetails2', lang)
 : Math.round(observation.bortleIndex) <= 6
 ? t('obs.bortleDetails3', lang)
 : t('obs.bortleDetails4', lang)
  }
  </p>
  <p className="text-2xs text-slate-500 mt-2 leading-relaxed">
  {t('obs.bortleDisclaimer', lang)}
  </p>
 <button
 onClick={() => setIsMapOpen(true)}
 className="mt-3 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-slate-700/50 hover:border-indigo-500/40 rounded-lg text-2xs font-semibold flex items-center gap-1.5 transition-all outline-none"
 >
 <MapPin className="w-3.5 h-3.5" />
 {t('lightPollutionMap.openMap', lang)}
 </button>
 </div>
 
 {/* Visual Gauge Scale (1 to 9 sky simulator bar) */}
 <div className="shrink-0 w-full md:w-auto flex flex-col gap-2 select-none">
 <span className="text-4xs font-semibold uppercase tracking-wider text-slate-500 text-center md:text-left">
 {t('obs.skyBrightnessGauge', lang)}
 </span>
 <div className="relative w-full md:w-[260px] h-9 bg-slate-900/40 rounded-xl border border-slate-700/50 overflow-hidden p-1 flex items-center justify-between">
 {/* Gradient strip background */}
 <div className="absolute inset-y-1 inset-x-1 rounded-lg bg-gradient-to-r from-[#020205] via-[#101935] to-[#ca8a04] opacity-80" />
 
 {/* Grid line markers */}
 {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
 const isCurrent = Math.round(observation.bortleIndex) === num;
 return (
 <div key={num} className="h-full flex-1 flex flex-col items-center justify-center relative z-10">
 {/* Tiny tick */}
 <div className="w-[1px] h-1 bg-white/20 mb-0.5" />
 <span className={`text-4xs font-mono leading-none ${isCurrent ? 'text-white font-black scale-110' : 'text-slate-500'}`}>{num}</span>
 {isCurrent && (
 <>
 {/* Neon Pointer overlay */}
 <div className="absolute -top-1 w-2.5 h-2.5 bg-indigo-400 rotate-45 border border-white rounded-sm" />
 <div className="absolute inset-0 border border-indigo-400 rounded bg-indigo-500/10 pointer-events-none" />
 </>
 )}
 </div>
 );
 })}
 </div>
 <div className="flex justify-between px-1 text-4xs text-slate-500 font-semibold uppercase tracking-wide">
 <span className="text-emerald-400">{t('obs.darkClass1', lang)}</span>
 <span className="text-amber-500">{t('obs.urbanClass9', lang)}</span>
 </div>
 </div>
 </div>

 {/* Sparkline for night */}
 <div className="pt-2 border-t border-slate-700/45">
 <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">{t('obs.hourlyTrend', lang)}</span>
 <HourlyCloudChart hourly={observation.hourly} lang={lang} timezone={currentLocation.timezone} />
 </div>

 <div className="grid grid-cols-1 gap-4 mt-6">
        <AuroraForecast lang={lang} />
      </div>
      </div>
      ) : null}
 </div>


 {/* F5.4: koşullu portal deseni yerine hep-mounted StandardModal — `AnimatePresence >
 Suspense` kombinasyonunun kırdığı çıkış animasyonu bu bileşende tam oynar; odak
 tuzağı, ESC, aria-modal, gövde kaydırma kilidi ve F5.3 geri-tuşu kaydı tabandan gelir. */}
 <StandardModal
 open={isMapOpen}
 onClose={() => setIsMapOpen(false)}
 variant="fullscreen"
 ariaLabel={t('lightPollutionMap.title', lang)}
 panelClassName="bg-black/80 backdrop-blur-md flex flex-col overflow-hidden"
 >
 <LightPollutionMap
 currentLocation={currentLocation}
 lang={lang}
 onClose={() => setIsMapOpen(false)}
 onLocationSelect={(location) => { onLocationChange(location); setLocationSource('manual'); }}
 />
 </StandardModal>
 </div>
 );
};




