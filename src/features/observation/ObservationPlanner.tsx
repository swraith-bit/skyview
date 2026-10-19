import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LangCode } from '../../i18n';
import { getMoonPhase, getVisiblePlanets } from '../../utils/astronomy';
import { calculateObservationScore } from '../../utils/observationScore';
import { estimateBortleScale } from '../../utils/events';
import {
  filterUpcomingIndices,
  findAnchorIndexForDay,
  groupHourlyIndicesByLocalDay,
  nightWindowIndicesForDay,
} from '../../utils/plannerNightWindow';
import { CalendarDays, CloudSun, Moon, Star, Info } from 'lucide-react';
import { PanelLoadingSkeleton } from '../../components/ui/Skeleton';
import { useAppStore } from '../../store/useAppStore';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

interface DayPlan {
 date: Date;
 score: number; // 0-100
 cloudForecast: number; // 0-100 avg cloud cover
 moonIllumination: number; // 0-1
 moonPhase: string;
 visiblePlanetCount: number;
 label: string;
 color: string;
}

interface HourlyCloudData {
 time: number[];
 cloudCover: number[];
 windSpeed: number[];
 humidity: number[];
}

const fetchWeeklyCloudData = async (
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<HourlyCloudData> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=cloud_cover,wind_speed_10m,relative_humidity_2m&forecast_days=7&timezone=auto&timeformat=unixtime`;
 const response = await fetchWithTimeout(url, { signal }, 10_000);
  if (!response.ok) throw new Error('FETCH_FAILED');
  const data = await response.json();
  if (!Array.isArray(data.hourly?.time) || !Array.isArray(data.hourly?.cloud_cover)) {
    throw new Error('INVALID_API_RESPONSE');
  }
  return {
    time: data.hourly.time,
    cloudCover: data.hourly.cloud_cover,
    windSpeed: Array.isArray(data.hourly.wind_speed_10m) ? data.hourly.wind_speed_10m : [],
    humidity: Array.isArray(data.hourly.relative_humidity_2m) ? data.hourly.relative_humidity_2m : [],
  };
};

const LABELS: Record<string, Partial<Record<LangCode, string>>> = {
 title: { en: 'Observation Planner', tr: 'Gözlem Planlayıcı' },
 subtitle: { en: '7-Day Sky Score', tr: '7 Günlük Gökyüzü Skoru' },
 excellent: { en: 'Excellent', tr: 'Mükemmel' },
 good: { en: 'Good', tr: 'İyi' },
 fair: { en: 'Fair', tr: 'Orta' },
 poor: { en: 'Poor', tr: 'Kötü' },
 cloud: { en: 'Cloud Cover', tr: 'Bulutluluk' },
 moon: { en: 'Moon Phase', tr: 'Ay Fazı' },
 planets: { en: 'Visible Planets', tr: 'Görünür Gezegen' },
 score: { en: 'Observation Score', tr: 'Gözlem Skoru' },
 tonight: { en: 'Tonight', tr: 'Bu Gece' },
 tomorrow: { en: 'Tomorrow', tr: 'Yarın' },
 bestNight: { en: 'Best Night', tr: 'En İyi Gece' },
 loading: { en: 'Loading weather data...', tr: 'Hava verisi yükleniyor...' },
 tip: { en: 'Tip', tr: 'İpucu' },
};
const L = (k: string, lang: LangCode): string =>
 (LABELS[k]?.[lang]) || (LABELS[k]?.en) || k;

const weatherUnavailableLabel: Record<LangCode, string> = {
 en: 'Weather data unavailable. Check your internet connection.',
 tr: 'Hava verisi alınamadı. İnternet bağlantınızı kontrol edin.',
 de: 'Weather data unavailable.',
 fr: 'Weather data unavailable.',
 es: 'Datos del clima no disponibles.',
 ar: 'Weather data unavailable.',
 it: 'Dati meteo non disponibili.',
 pt: 'Dados de tempo indisponíveis.',
};

function scoreLabel(score: number, lang: LangCode): { text: string; color: string; bg: string; border: string } {
 if (score >= 75) return { text: L('excellent', lang), color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' };
 if (score >= 50) return { text: L('good', lang), color: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-white/5' };
 if (score >= 30) return { text: L('fair', lang), color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' };
 return { text: L('poor', lang), color: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30' };
}

function scoreColor(score: number): string {
 if (score >= 75) return '#10b981';
 if (score >= 50) return '#38bdf8';
 if (score >= 30) return '#f59e0b';
 return '#f43f5e';
}

export const ObservationPlanner: React.FC = () => {
  // F3.2: selector-based subscriptions — unrelated store writes no longer
  // re-render the whole plan page.
  const currentLocation = useAppStore(state => state.currentLocation);
  const lang = useAppStore(state => state.lang);
 const [selectedDay, setSelectedDay] = useState(0);

 const { data: cloudData, isLoading: loading, isError: fetchError } = useQuery({
  queryKey: ['weekly-cloud-forecast', currentLocation.latitude, currentLocation.longitude],
  queryFn: ({ signal }) => fetchWeeklyCloudData(currentLocation.latitude, currentLocation.longitude, signal),
  staleTime: 15 * 60 * 1000,
  gcTime: 24 * 60 * 60 * 1000,
  retry: 1,
 });

 const plans: DayPlan[] = useMemo(() => {
    if (!cloudData) return [];
    const nowMs = Date.now();
    const timeZone = currentLocation.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    // F4.1: one pass groups real sample indices per local day — no more `i * 24`
    // assumption (DST drift / truncated last days) and no more NaN on empty series.
    const dayGroups = groupHourlyIndicesByLocalDay(cloudData.time, timeZone);
    const dayKeys = Array.from(dayGroups.keys()).slice(0, 7);

    return dayKeys.map((dayKey, i) => {
      const dayGroup = dayGroups.get(dayKey);
      const nextDayDate = new Date(`${dayKey}T12:00:00Z`);
      nextDayDate.setUTCDate(nextDayDate.getUTCDate() + 1);
      // noUncheckedIndexedAccess: ISO format her zaman 'T' öncesi tarih parçasını verir
      const nextDayKey = nextDayDate.toISOString().split('T')[0] ?? '';
      const nextDayGroup = dayGroups.get(nextDayKey);

      const anchorIndex = findAnchorIndexForDay(cloudData.time, dayGroup, timeZone);
      if (anchorIndex < 0) return null;

      // noUncheckedIndexedAccess: anchorIndex geçerli indeks; veri kaybolduysa günü atla
      const anchorTs = cloudData.time[anchorIndex];
      if (anchorTs === undefined) return null;
      const targetTime = new Date(anchorTs * 1000);
      const date = targetTime;

      const nightHourIndices = nightWindowIndicesForDay(cloudData.time, dayGroup, nextDayGroup, timeZone);
      // F4.1: "Tonight" averages only the hours that are still ahead of the user —
      // past hours of the same night must not inflate/deflate the remaining plan.
      const upcomingNightIndices = i === 0
        ? filterUpcomingIndices(nightHourIndices, cloudData.time, nowMs)
        : [];
      const scoredNightIndices = upcomingNightIndices.length > 0 ? upcomingNightIndices : nightHourIndices;

      const windKnown = cloudData.windSpeed.length > 0;
      const humidityKnown = cloudData.humidity.length > 0;
      const moonPhaseInfo = getMoonPhase(targetTime, lang);
      const cloudPct = scoredNightIndices.length > 0
        ? Math.round(scoredNightIndices.reduce((sum, idx) => sum + (cloudData.cloudCover[idx] ?? 50), 0) / scoredNightIndices.length)
        : (cloudData.cloudCover[anchorIndex] ?? 50);
      const windAvg = scoredNightIndices.length > 0
        ? Math.round(scoredNightIndices.reduce((sum, idx) => sum + (cloudData.windSpeed[idx] ?? 0), 0) / scoredNightIndices.length)
        : (cloudData.windSpeed[anchorIndex] ?? 0);
      const humAvg = scoredNightIndices.length > 0
        ? Math.round(scoredNightIndices.reduce((sum, idx) => sum + (cloudData.humidity[idx] ?? 50), 0) / scoredNightIndices.length)
        : (cloudData.humidity[anchorIndex] ?? 50);

      const planets = getVisiblePlanets(targetTime, currentLocation.latitude, currentLocation.longitude);
      const bortleIndex = estimateBortleScale(currentLocation.latitude, currentLocation.longitude);

      const total = calculateObservationScore({
        cloudCover: cloudPct,
        windSpeed: windAvg,
        humidity: humAvg,
        windKnown,
        humidityKnown,
        bortleIndex,
        moonIllumination: moonPhaseInfo.fraction,
        visiblePlanetsCount: planets.length
      });

      const lbl = scoreLabel(total, lang);
      return {
        date,
        score: total,
        cloudForecast: cloudPct,
        moonIllumination: moonPhaseInfo.fraction,
        moonPhase: moonPhaseInfo.phaseName,
        visiblePlanetCount: planets.length,
        label: lbl.text,
        color: lbl.color,
      };
    }).filter((plan): plan is DayPlan => plan !== null);
 }, [cloudData, currentLocation, lang]);

 const bestDayIdx = useMemo(() => {
 if (plans.length === 0) return 0;
 return plans.reduce((best, p, i) => p.score > (plans[best]?.score ?? Number.NEGATIVE_INFINITY) ? i : best, 0);
 }, [plans]);

 const sel = plans[selectedDay];
 const selectedLabel = useMemo(() => sel ? scoreLabel(sel.score, lang) : null, [sel, lang]);

 const dayLabel = (date: Date, i: number): string => {
 if (i === 0) return L('tonight', lang);
 if (i === 1) return L('tomorrow', lang);
  return date.toLocaleDateString(lang, { weekday: 'short', timeZone: currentLocation.timezone });
 };

 if (loading) {
 return (
 <div className="bg-[#030612]/90 backdrop-blur-md rounded-xl border border-white/5 p-6 shadow-sm">
 <PanelLoadingSkeleton />
 </div>
 );
 }

 if (fetchError || !cloudData) {
 return (
 <div className="bg-[#030612]/90 backdrop-blur-md rounded-xl border border-white/5 p-6 shadow-sm">
 <div className="flex items-center gap-3 mb-4">
 <CalendarDays className="w-5 h-5 text-indigo-400" />
 <h2 className="text-base font-semibold text-white">{L('title', lang)}</h2>
 </div>
 <div className="flex items-center gap-3 py-6 justify-center text-rose-400 text-sm font-medium">
 {weatherUnavailableLabel[lang]}
 </div>
 </div>
 );
 }

 return (
 <div className="bg-[#030612]/90 backdrop-blur-md rounded-xl border border-white/5 p-5 shadow-sm">
 {/* Header */}
 <div className="flex items-center gap-3 mb-5">
 <div className="w-9 h-9 bg-sky-500/15 rounded-xl flex items-center justify-center border border-white/5">
 <CalendarDays className="w-4 h-4 text-sky-400" />
 </div>
 <div>
 <h2 className="text-base font-semibold text-white">{L('title', lang)}</h2>
 <p className="text-2xs text-slate-500">{L('subtitle', lang)}</p>
 </div>
 {bestDayIdx === 0 && (
 <span className="ml-auto text-2xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-1 rounded-full">
  ★ {L('tonight', lang)}!
 </span>
 )}
 </div>

 {/* 7-day bar chart selector */}
 <div className="flex gap-1.5 mb-5 overflow-x-auto pb-2 scrollbar-thin snap-x snap-mandatory">
 {plans.map((p, i) => (
 <button
 key={i}
 onClick={() => setSelectedDay(i)}
 className={`flex-1 min-w-[58px] sm:min-w-0 snap-center flex flex-col items-center gap-1.5 rounded-xl py-2.5 px-1 border transition-all ${selectedDay === i ? 'bg-indigo-600/20 border-white/5' : 'bg-slate-900/40 border-white/5 hover:border-white/5'} ${bestDayIdx === i ? 'ring-1 ring-emerald-500/40' : ''}`}
 >
 <span className="text-3xs font-semibold text-slate-400 uppercase leading-none truncate w-full text-center">
 {dayLabel(p.date, i)}
 </span>
 {/* Score arc */}
 <div className="relative w-8 h-8">
 <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
 <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="4" />
 <circle cx="18" cy="18" r="14" fill="none"
 stroke={scoreColor(p.score)} strokeWidth="4"
 strokeDasharray={`${p.score * 0.88} 88`}
 strokeLinecap="round" />
 </svg>
 <span className="absolute inset-0 flex items-center justify-center text-3xs font-black"
 style={{ color: scoreColor(p.score) }}>
 {p.score}
 </span>
 </div>
 {/* Cloud mini icon */}
 <div className="flex items-center gap-0.5">
 <CloudSun className="w-2.5 h-2.5 text-slate-500" />
 <span className="text-4xs text-slate-500">{Math.round(p.cloudForecast)}%</span>
 </div>
 {bestDayIdx === i && (
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
 )}
 </button>
 ))}
 </div>

 {/* Selected day detail */}
 {sel && selectedLabel && (
 <>
 <div className={`rounded-xl border p-4 space-y-3 ${selectedLabel.bg} ${selectedLabel.border}`}>
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div className="min-w-0 space-y-1">
 <span className="block text-2xs text-slate-400 uppercase font-semibold tracking-wide">
  {sel.date.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long', timeZone: currentLocation.timezone })}
  </span>
  <h3 className="text-lg sm:text-xl font-semibold text-white leading-snug">
  {L('score', lang)}: {sel.score}/100 — {sel.label}
  </h3>
  </div>
 {/* Big score ring */}
 <div className="relative w-14 h-14">
 <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
 <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="3" />
 <circle cx="18" cy="18" r="14" fill="none"
 stroke={scoreColor(sel.score)} strokeWidth="3"
 strokeDasharray={`${sel.score * 0.88} 88`}
 strokeLinecap="round" />
 </svg>
 <span className="absolute inset-0 flex items-center justify-center text-base font-black"
 style={{ color: scoreColor(sel.score) }}>{sel.score}</span>
 </div>
 </div>

 {/* Detail stats */}
 <div className="grid grid-cols-3 gap-2">
 <div className="text-center bg-black/20 rounded-xl py-2">
 <CloudSun className="w-4 h-4 mx-auto mb-1 text-sky-400" />
 <div className="text-xs font-semibold text-white">{Math.round(sel.cloudForecast)}%</div>
 <div className="text-3xs text-slate-500">{L('cloud', lang)}</div>
 </div>
 <div className="text-center bg-black/20 rounded-xl py-2">
 <Moon className="w-4 h-4 mx-auto mb-1 text-amber-300" />
 <div className="text-xs font-semibold text-white">{Math.round(sel.moonIllumination * 100)}%</div>
 <div className="text-3xs text-slate-500">{L('moon', lang)}</div>
 </div>
 <div className="text-center bg-black/20 rounded-xl py-2">
 <Star className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
 <div className="text-xs font-semibold text-white">{sel.visiblePlanetCount}</div>
 <div className="text-3xs text-slate-500">{L('planets', lang)}</div>
 </div>
 </div>

 {/* Tip */}
 <div className="flex gap-2 bg-black/20 rounded-xl p-3">
 <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
 <p className="text-xs-plus text-slate-400 leading-relaxed">
 {getPlannerTip(sel, lang)}
 </p>
 </div>
 </div>
 </>
 )}
 </div>
 );
};

function getPlannerTip(day: DayPlan, lang: LangCode): string {
 // noUncheckedIndexedAccess: literal key'li Record; 7 tip tüm girişlerde mevcut
 type DayTipKey = 'excellent_dark' | 'excellent' | 'good_moon' | 'good' | 'fair_cloud' | 'fair' | 'poor';
 const tips: Partial<Record<LangCode, Record<DayTipKey, string>>> = {
 tr: {
 excellent_dark: 'Mükemmel koşullar! Gözlem için ideal gece.',
 excellent: 'Harika bir gözlem gecesi! Gezegenleri ve yıldız kümelerini kolayca görebilirsiniz.',
 good_moon: 'İyi koşullar fakat parlak ay ışığı var. Gezegen gözlemi için çok uygun.',
 good: 'Genel olarak iyi bir gece. Parlak yıldızlar ve gezegenler rahatça görülür.',
 fair_cloud: 'Bulutlar görüşü kısmen engelliyor. Fırsat buldukça bulutlar arasından bakın.',
 fair: 'Orta koşullar. Sabır gerektirir ama parlak gezegenler görülebilir.',
 poor: 'Yoğun bulut örtüsü nedeniyle gözlem zorlaşacak. Yarın daha iyi koşullar olabilir.',
 },
 en: {
 excellent_dark: 'Excellent! Dark sky with minimal clouds - perfect for deep sky objects.',
 excellent: 'Great observation night! Planets and star clusters easily visible.',
 good_moon: 'Good conditions but bright moonlight present. Best for planet observation.',
 good: 'Good night overall. Bright stars and planets easily visible.',
 fair_cloud: 'Patchy clouds may interrupt viewing. Watch between gaps for best results.',
 fair: 'Fair conditions. Patience required, but bright planets are visible.',
 poor: 'Heavy cloud cover makes observation difficult. Check tomorrow.',
 },
 };

 const dict = tips[lang] || tips.en!;
 if (day.score >= 75 && day.moonIllumination < 0.25) return dict.excellent_dark;
 if (day.score >= 75) return dict.excellent;
 if (day.score >= 50 && day.moonIllumination > 0.6) return dict.good_moon;
 if (day.score >= 50) return dict.good;
 if (day.score >= 30 && day.cloudForecast > 50) return dict.fair_cloud;
 if (day.score >= 30) return dict.fair;
 return dict.poor;
}
