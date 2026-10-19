import React, { useEffect, useMemo, useState } from 'react';
import { MoonPhaseCalendar } from './MoonPhaseCalendar';
import { ObservationPlanner } from '../observation/ObservationPlanner';
import { MeteorShowers } from './MeteorShowers';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import { Sparkles, CalendarPlus } from 'lucide-react';
import { getLocalDateParts, getLocalDayDiff } from '../../utils/dateTime';
import { useObserverContext } from '../../hooks/useObserverContext';
import { useAstroEventsQuery } from '../../hooks/queries/useAstroEventsQuery';

export const AstroEventsHub: React.FC = () => {
  // F3.2 pattern: selector subscriptions — unrelated store writes no longer
  // re-render the hub.
  const lang = useAppStore(state => state.lang);
  const currentLocation = useAppStore(state => state.currentLocation);
  const currentRoute = useAppStore(state => state.currentRoute);
  const [filterType, setFilterType] = useState<'all' | 'eclipse' | 'meteor' | 'planet'>('all');
  const timeZone = currentLocation?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const observer = useObserverContext(currentLocation);

  // F3.5: the heavy 3-year eclipse search + 60-day planet sweep runs in the
  // shared astronomy worker, cached 15 minutes per day/location/language.
  // The per-minute observer tick below only re-runs the cheap upcoming filter.
  const { data: astroEvents } = useAstroEventsQuery(lang, timeZone, observer.instant, currentLocation);

 const upcomingEvents = useMemo(() => {
 const now = observer.instant;
 return (astroEvents ?? [])
 .filter(e => getLocalDayDiff(now, e.date, timeZone) >= 0)
 .sort((a, b) => a.date.getTime() - b.date.getTime());
 }, [astroEvents, observer.instant, timeZone]);

 // Apply filters
 const filteredEvents = upcomingEvents.filter(e => {
 const dayDiff = getLocalDayDiff(observer.instant, e.date, timeZone);
 if (dayDiff > 31) return false;
 if (filterType === 'all') return true;
 return e.type === filterType;
 });

 const formatDateForCal = (d: Date) => {
 const parts = getLocalDateParts(d, timeZone);
 const yyyy = parts.year;
 const mm = String(parts.month + 1).padStart(2, '0');
 const dd = String(parts.day).padStart(2, '0');
 return `${yyyy}${mm}${dd}`;
 };

 const getCountdownString = (d: Date) => {
 const diffDays = getLocalDayDiff(observer.instant, d, timeZone);
 if (diffDays <= 0) {
 return `${t('events.today', lang)}! 🌟`;
 }

 return `${diffDays} ${t('events.daysLeft', lang)}`;
 };

 useEffect(() => {
 if (currentRoute !== 'plan:meteor') return;
 const frame = requestAnimationFrame(() => document.getElementById('meteor-showers')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
 return () => cancelAnimationFrame(frame);
 }, [currentRoute]);

 return (
 <div className="space-y-8">
 {/* 1. Moon Calendar & Observation Planner */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
   <div className="bg-app-panel/90 rounded-xl border border-white/5 p-0 md:p-6 shadow-sm overflow-hidden md:overflow-visible animate-scale-up">
     <MoonPhaseCalendar />
   </div>
   <ObservationPlanner />
 </div>

 {/* 3. Meteor Showers */}
 <MeteorShowers />

 {/* 5. Upgraded Significant Astro Events Calendar */}
 <div className="bg-app-bg/90 backdrop-blur-md rounded-xl border border-white/5 p-6 lg:p-8 shadow-sm animate-slide-up">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
 <h2 className="text-xl font-semibold flex items-center gap-2 text-white font-display">
 <Sparkles className="w-5 h-5 text-indigo-400" />
 {t('moon.eventsTitle', lang)}
 </h2>

 {/* Event Category Filter Tabs */}
 <div className="grid grid-cols-2 sm:flex gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10 self-stretch sm:self-auto">
 <button
 onClick={() => setFilterType('all')}
 className={`min-w-0 px-2 min-h-11 rounded-lg text-xs font-semibold uppercase leading-tight transition-all cursor-pointer ${
 filterType === 'all'
 ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30'
 : 'text-slate-400 hover:text-slate-200'
 }`}
 >
 {t('events.filterAll', lang)}
 </button>
 <button
 onClick={() => setFilterType('eclipse')}
 className={`min-w-0 px-2 min-h-11 rounded-lg text-xs font-semibold uppercase leading-tight transition-all cursor-pointer ${
 filterType === 'eclipse'
 ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30'
 : 'text-slate-400 hover:text-slate-200'
 }`}
 >
 {t('events.filterEclipses', lang)}
 </button>
 <button
 onClick={() => setFilterType('meteor')}
 className={`min-w-0 px-2 min-h-11 rounded-lg text-xs font-semibold uppercase leading-tight transition-all cursor-pointer ${
 filterType === 'meteor'
 ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30'
 : 'text-slate-400 hover:text-slate-200'
 }`}
 >
 {t('events.filterMeteors', lang)}
 </button>
 <button
 onClick={() => setFilterType('planet')}
 className={`min-w-0 px-2 min-h-11 rounded-lg text-xs font-semibold uppercase leading-tight transition-all cursor-pointer ${
 filterType === 'planet'
 ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30'
 : 'text-slate-400 hover:text-slate-200'
 }`}
 >
 { { tr: 'Gezegenler', en: 'Planets', de: 'Planeten', fr: 'Planètes', es: 'Planetas', ar: 'الكواكب', it: 'Pianeti', pt: 'Planetas' }[lang] || 'Planets' }
 </button>
 </div>
 </div>

 {/* Events List */}
 <div className="grid grid-cols-1 gap-4">
 {filteredEvents.length > 0 ? (
 filteredEvents.map((ev, i) => {
 const nextDay = new Date(ev.date);
 nextDay.setDate(nextDay.getDate() + 1);
 const googleCalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${formatDateForCal(ev.date)}/${formatDateForCal(nextDay)}&details=${encodeURIComponent(ev.description)}`;
 const eventDateParts = getLocalDateParts(ev.date, timeZone);
 
 return (
 <div key={i} className="bg-app-panel-raised p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center group hover:border-white/5 transition-colors shadow-inner">
 <div className="flex gap-4 items-start">
 {/* Date Badge */}
 <div className="bg-app-bg rounded-xl p-3 shrink-0 flex flex-col items-center justify-center min-w-[60px] border border-white/5 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
 <span className="text-xs font-semibold text-indigo-200/60 uppercase leading-none mb-1">
 {ev.date.toLocaleDateString(lang, { month: 'short', timeZone })}
 </span>
 <span className="text-lg font-black text-indigo-400 leading-none">{eventDateParts.day}</span>
 </div>
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <h3 className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">{ev.title}</h3>
 {/* Countdown Badge */}
 <span className="text-3xs font-black uppercase bg-slate-800/30 border border-white/5 text-indigo-300 px-2 py-0.5 rounded-full">
 {getCountdownString(ev.date)}
 </span>
 </div>
 <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ev.description}</p>
 </div>
 </div>

 {/* Add to Calendar Button */}
 <a
 href={googleCalUrl}
 target="_blank"
 rel="noreferrer"
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/5 text-slate-300 hover:text-white font-semibold text-xs shadow-sm transition-all self-end sm:self-auto hover:bg-indigo-600/20 hover:border-white/5 cursor-pointer"
 >
 <CalendarPlus className="w-3.5 h-3.5 text-indigo-400" />
 {t('events.addToCalendar', lang)}
 </a>
 </div>
 );
 })
 ) : (
 <div className="text-center text-slate-500 text-xs py-8 animate-pulse">
 {t('events.noEvents', lang)}
 </div>
 )}
 </div>
 </div>
 </div>
 );
};
