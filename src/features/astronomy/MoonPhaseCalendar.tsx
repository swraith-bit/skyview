import React, { useState, useMemo, useEffect, useRef } from 'react';
import { generateCalendarMonth, getMoonPhaseForLocalDate, CalendarDay } from '../../utils/astronomy';
import { MoonRenderer } from './MoonRenderer';
import { ChevronLeft, ChevronRight, Calendar, HelpCircle } from 'lucide-react';
import { t } from '../../i18n';
import { useAppStore } from '../../store/useAppStore';
import { useObserverContext } from '../../hooks/useObserverContext';

export const MoonPhaseCalendar: React.FC = () => {
  const { lang, currentLocation } = useAppStore();
  const timeZone = currentLocation?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
 const observer = useObserverContext(currentLocation);
 const today = observer.instant;
 const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
 const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
 const [sliderOffset, setSliderOffset] = useState<number>(0);

 const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(() => {
 const todayPhase = getMoonPhaseForLocalDate(today, lang, timeZone);
 return {
 date: today,
 isCurrentMonth: true,
 moonPhase: todayPhase
 };
 });

 const previewDate = useMemo(() => {
 if (!selectedDay) return null;
 const d = new Date(selectedDay.date);
 d.setDate(d.getDate() + sliderOffset);
 return d;
 }, [selectedDay, sliderOffset]);

 const previewMoonPhase = useMemo(() => {
 if (!previewDate) return null;
 return getMoonPhaseForLocalDate(previewDate, lang, timeZone);
 }, [previewDate, lang, timeZone]);

 const calendarCells = useMemo(() => {
 return generateCalendarMonth(currentYear, currentMonth, lang, timeZone);
 }, [currentYear, currentMonth, lang, timeZone]);

  // F6.10: bugünün hücresi 15'lik sayfa bölümünün dışında kalırsa (ayın
  // ikinci yarısında bir gün) ilk açılış/ay değişiminde bulunduğu sayfaya
  // görünümü alınır — bugün zaten işaretliydi ama ekranda olmayabilirdi.
  const todayCellRef = useRef<HTMLButtonElement | null>(null);
  const scrolledMonthRef = useRef<string>('');
  useEffect(() => {
    const monthKey = `${currentYear}-${currentMonth}`;
    if (scrolledMonthRef.current === monthKey) return;
    scrolledMonthRef.current = monthKey;
    todayCellRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [currentYear, currentMonth]);

 const handlePrevMonth = () => {
 setSliderOffset(0);
 if (currentMonth === 0) {
 setCurrentMonth(11);
 setCurrentYear(prev => prev - 1);
 } else {
 setCurrentMonth(prev => prev - 1);
 }
 };

 const handleNextMonth = () => {
 setSliderOffset(0);
 if (currentMonth === 11) {
 setCurrentMonth(0);
 setCurrentYear(prev => prev + 1);
 } else {
 setCurrentMonth(prev => prev + 1);
 }
 };

 const handleBackToToday = () => {
 setSliderOffset(0);
 setCurrentYear(today.getFullYear());
 setCurrentMonth(today.getMonth());
 const todayPhase = getMoonPhaseForLocalDate(today, lang, timeZone);
 setSelectedDay({
 date: today,
 isCurrentMonth: true,
 moonPhase: todayPhase
 });
 };

 // Month name header helper

 const monthNameHeader = useMemo(() => {
 return new Date(currentYear, currentMonth, 1).toLocaleDateString(lang, { month: 'long' });
 }, [currentYear, currentMonth, lang]);

 return (
 <div id="moon-calendar-widget" className="grid grid-cols-1 xl:grid-cols-12 gap-8 text-white">
 
 <div className="xl:col-span-8 flex flex-col justify-between">
 
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
 <div>
 <h2 className="text-xl font-semibold flex items-center gap-2">
 <Calendar className="w-5 h-5 text-indigo-400" />
 {t('moon.calendarTitle', lang)}
 </h2>
 <p className="text-slate-400 text-xs mt-1">
 {t('moon.calendarDesc', lang)}
 </p>
 </div>

 <div className="grid grid-cols-[48px_minmax(0,1fr)_48px] gap-2 w-full sm:flex sm:w-auto items-center self-start sm:self-center">
 <button
   type="button"
   onClick={handlePrevMonth}
   aria-label={lang === 'tr' ? 'Önceki ay' : 'Previous month'}
   className="min-h-12 min-w-12 p-2 rounded-xl bg-app-bg hover:bg-app-panel-raised border border-white/5 transition-colors text-slate-300 flex items-center justify-center"
 >
   <ChevronLeft className="w-5 h-5" />
 </button>
 <button
   type="button"
   onClick={handleBackToToday}
   className="min-h-11 col-span-3 row-start-2 sm:row-auto sm:col-auto px-3 py-1.5 text-xs font-semibold bg-indigo-900 hover:bg-indigo-800 border border-white/5 text-white rounded-xl transition cursor-pointer"
 >
 {t('moon.goToToday', lang)}
 </button>
 <div className="min-w-0 bg-app-bg px-2 sm:px-4 py-2 rounded-xl border border-white/5 text-xs sm:text-sm font-semibold sm:min-w-[124px] text-center select-none text-indigo-400 break-words">
 {monthNameHeader} {currentYear}
 </div>
 <button
   type="button"
   onClick={handleNextMonth}
   aria-label={lang === 'tr' ? 'Sonraki ay' : 'Next month'}
   className="min-h-12 min-w-12 p-2 rounded-xl bg-app-bg hover:bg-app-panel-raised border border-white/5 transition-colors text-slate-300 flex items-center justify-center"
 >
   <ChevronRight className="w-5 h-5" />
 </button>
 </div>
 </div>

  <div className="flex max-w-full overflow-x-auto overscroll-x-contain snap-x snap-mandatory gap-4 pb-3 -mx-1 px-1 touch-auto scrollbar-thin">
 {Array.from({ length: Math.ceil(calendarCells.filter(c => c.isCurrentMonth).length / 15) }).map((_, pIdx) => {
 const page = calendarCells.filter(c => c.isCurrentMonth).slice(pIdx * 15, pIdx * 15 + 15);
 return (
 <div key={pIdx} className="min-w-full shrink-0 snap-center grid grid-cols-3 sm:grid-cols-5 gap-2 lg:gap-3 bg-app-bg/80 p-3 rounded-xl border border-white/5 shadow-inner">
 {page.map((cell, idx) => {
 const isSelected = selectedDay && selectedDay.date.toDateString() === cell.date.toDateString();
 const isToday = cell.date.toDateString() === today.toDateString();
 
 const cellMonth = cell.date.toLocaleDateString(lang, { month: 'short' }).replace(/\.$/, '');
 const cellWeekday = cell.date.toLocaleDateString(lang, { weekday: 'short' });
 const dateLabel = `${cell.date.getDate()} ${cellMonth}`;
 const fullDateLabel = cell.date.toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });

 return (
 <button
 key={idx}
 type="button"
 aria-label={fullDateLabel}
 title={fullDateLabel}
 ref={isToday ? todayCellRef : undefined}
 onClick={() => { setSelectedDay(cell); setSliderOffset(0); }}
 className={`group relative flex min-h-[7.6rem] flex-col items-center overflow-hidden p-2 md:p-3 rounded-xl border transition-all duration-150 cursor-pointer select-none sm:min-h-[8rem] ${
 isSelected
 ? 'bg-indigo-900/30 border-white/5 shadow-[0_0_15px_rgba(99,102,241,0.2)] text-white'
 : isToday
 ? 'bg-slate-800/30 border-white/5 font-semibold text-white'
 : 'bg-app-panel-raised/50 hover:bg-slate-800/30 border-white/5 hover:border-white/5 text-slate-300'
 }`}
 >
 <span className="block h-4 w-full truncate text-center text-3xs md:text-2xs text-slate-500 font-semibold uppercase leading-4">{cellWeekday}</span>
 <span className={`mt-0.5 block min-h-[1.05rem] w-full truncate text-center text-xs-plus md:text-xs font-semibold leading-tight ${
 isSelected ? 'text-indigo-300' : isToday ? 'text-white' : 'text-slate-400'
 }`}>
 {dateLabel}
 </span>
 
 <div className="mt-1 flex h-12 w-full flex-1 transform items-center justify-center overflow-hidden transition duration-250 group-hover:scale-105">
 <MoonRenderer phaseType={cell.moonPhase.phaseType} size={34} showGlow={false} />
 </div>
 
 {isToday && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-indigo-500 rounded-full" />}
 </button>
 );
 })}
 </div>
 );
 })}
 </div>
 </div>

 <div className="xl:col-span-4 flex flex-col justify-between bg-slate-900/60 rounded-xl border border-white/5 p-6 min-h-[420px]">
 {selectedDay && previewDate && previewMoonPhase ? (
 <div className="flex flex-col h-full justify-between space-y-5">
 
 <div className="text-center sm:text-left">
 <span className="text-2xs font-semibold uppercase tracking-widest text-indigo-400">
 {t('moon.details', lang)}
 </span>
 <h3 className="text-lg font-semibold text-white mt-1">
 {previewDate.toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
 </h3>
 {previewDate.toDateString() === today.toDateString() && (
 <span className="inline-block mt-1 mx-auto bg-slate-800 text-slate-300 text-2xs font-semibold px-2 py-0.5 rounded-full select-none">
 {t('moon.today', lang)}
 </span>
 )}
 </div>

 <div className="flex flex-col items-center justify-center py-4 relative">
 <div className="absolute w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
 <MoonRenderer phaseType={previewMoonPhase.phaseType} size={100} showGlow={true} />
 <h4 className="text-lg font-semibold text-white mt-3 text-center tracking-tight">
 {t(`moon.phases.${previewMoonPhase.phaseType}`, lang)}
 </h4>
 <p className="text-2xs text-slate-400 font-medium tracking-wide mt-1">
 {previewMoonPhase.isWaxing ? '🌓 ' + t('moon.waxing', lang) : '🌗 ' + t('moon.waning', lang)}
 </p>
 </div>

 <div className="space-y-2.5 pt-3 border-t border-white/5">
 <div className="flex items-center justify-between text-xs leading-none">
 <span className="text-slate-400">{t('moon.illumination', lang)}:</span>
 <span className="font-mono font-semibold text-white">%{(previewMoonPhase.fraction * 100).toFixed(1)}</span>
 </div>
 
 <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
 <div className="bg-indigo-400 h-full rounded-full shadow-inner transition-all duration-300" style={{ width: `${previewMoonPhase.fraction * 100}%` }} />
 </div>

 <div className="flex items-center justify-between text-xs pt-1">
 <span className="text-slate-400">{t('moon.cycle', lang)}:</span>
 <span className="font-mono font-semibold text-white">{previewMoonPhase.age.toFixed(1)} / 29.5</span>
 </div>
 </div>

 {/* Fütüristik Ay Evresi Sürgüsü */}
 <div className="pt-3 border-t border-white/5 space-y-2 select-none">
 <div className="flex justify-between items-center text-2xs font-semibold text-slate-400">
 <span>{t('moonSlider.title', lang)}</span>
 <span className="font-mono text-indigo-400">{sliderOffset > 0 ? `+${sliderOffset}` : sliderOffset} {t('moonSlider.days', lang)}</span>
 </div>
 <input
 type="range"
 min="-14"
 max="14"
 value={sliderOffset}
 onChange={(e) => setSliderOffset(Number(e.target.value))}
 aria-label={t('moonSlider.title', lang)}
 className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-ew-resize accent-indigo-500 hover:accent-indigo-400 outline-none transition-all"
 />
 <div className="flex justify-between text-4xs text-slate-500 font-semibold">
 <span>-14d ({t('moonSlider.ago', lang)})</span>
 <button onClick={() => setSliderOffset(0)} className="hover:text-indigo-400 transition-colors uppercase font-black tracking-wider">{t('moonSlider.reset', lang)}</button>
 <span>+14d ({t('moonSlider.later', lang)})</span>
 </div>
 </div>

 </div>
 ) : (
 <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
 <HelpCircle className="w-8 h-8 text-slate-600 mb-2" />
 <p className="text-sm">{t('moon.clickHint', lang)}</p>
 </div>
 )}
 </div>

 </div>
 );
};
