import React from 'react';
import { LangCode, t } from '../../i18n';
import { Globe2, Code2, Mail, MessageSquare, Moon, Palette, Sparkles, Sun, Eye } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { uiT } from '../../i18nUi';
import { THEME_MODES, ThemeMode } from '../../utils/theme';
import { selectionHaptic } from '../../utils/haptics';

// ── Flag SVGs ─────────────────────────────────────────────────────────────────
const FLAGS: Record<LangCode, React.ReactNode> = {
 en: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="26" height="13" className="rounded-sm"><clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath><clipPath id="t"><path d="M30,15 h30 v15 z v-15 h-30 z h-30 v-15 z v15 h30 z"/></clipPath><g clipPath="url(#s)"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/><path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/></g></svg>,
 tr: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="26" height="17" className="rounded-sm"><rect width="120" height="80" fill="#E30A17"/><circle cx="42.5" cy="40" r="20" fill="#fff"/><circle cx="47.5" cy="40" r="16" fill="#E30A17"/><polygon points="65,30 68.1,39.5 78.1,39.5 70,45.4 73.1,54.9 65,49 56.9,54.9 60,45.4 51.9,39.5 61.9,39.5" fill="#fff"/></svg>,
 de: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3" width="26" height="16" className="rounded-sm"><rect width="5" height="3" fill="#000"/><rect width="5" height="2" y="1" fill="#D00"/><rect width="5" height="1" y="2" fill="#FFCE00"/></svg>,
 fr: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" width="26" height="17" className="rounded-sm"><rect width="3" height="2" fill="#ED2939"/><rect width="2" height="2" fill="#fff"/><rect width="1" height="2" fill="#002395"/></svg>,
 es: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" width="26" height="17" className="rounded-sm"><rect width="3" height="2" fill="#c60b1e"/><rect width="3" height="1" y=".5" fill="#ffc400"/></svg>,
 ar: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" width="26" height="17" className="rounded-sm"><rect width="3" height="2" fill="#007A3D"/><rect width=".5" height="2" fill="#000"/><rect width=".5" height="2" x="2.5" fill="#CE1126"/><text x="1.5" y="1.35" textAnchor="middle" fontSize=".85" fill="#fff" fontFamily="serif">☪</text></svg>,
 it: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" width="26" height="17" className="rounded-sm"><rect width="3" height="2" fill="#CE2B37"/><rect width="2" height="2" fill="#fff"/><rect width="1" height="2" fill="#009246"/></svg>,
 pt: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" width="26" height="17" className="rounded-sm"><rect width="3" height="2" fill="#FF0000"/><rect width="1.2" height="2" fill="#006600"/><circle cx="1.2" cy="1" r=".45" fill="#FFD700" stroke="#fff" strokeWidth=".05"/></svg>,
};

const LANG_LABELS: Record<LangCode, string> = {
 en: 'English', tr: 'Türkçe', de: 'Deutsch',
 fr: 'Français', es: 'Español', ar: 'العربية',
 it: 'Italiano', pt: 'Português',
};

interface AboutProps {
  mode?: 'preferences' | 'about';
}

export const AboutModule: React.FC<AboutProps> = ({ mode = 'preferences' }) => {
  const { lang, setLang, themeMode, setThemeMode } = useAppStore();
  const isRtl = lang === 'ar';
  const themeIcons: Record<ThemeMode, React.ReactNode> = {
    'deep-space': <Sparkles className="h-5 w-5" />,
    oled: <Moon className="h-5 w-5" />,
    scotopic: <Eye className="h-5 w-5" />,
    daylight: <Sun className="h-5 w-5" />,
  };
  const themeLabels: Record<ThemeMode, { label: string; description: string }> = {
    'deep-space': { label: uiT('theme.deepSpace', lang), description: uiT('theme.deepSpaceDesc', lang) },
    oled: { label: uiT('theme.oled', lang), description: uiT('theme.oledDesc', lang) },
    scotopic: { label: uiT('theme.scotopic', lang), description: uiT('theme.scotopicDesc', lang) },
    daylight: { label: uiT('theme.daylight', lang), description: uiT('theme.daylightDesc', lang) },
  };

  return (
  <div className="mx-auto gap-6 max-w-2xl flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>

  {mode !== 'about' && <div className="space-y-6">

 {/* TUR 2 · Semantik tema seçici */}
 <div className="border-b border-white/10 pb-6">
 <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-white">
 <Palette className="h-5 w-5 text-indigo-400" />
 {uiT('theme.title', lang)}
 </h2>
 <p className="mb-4 text-sm text-slate-400">{uiT('theme.subtitle', lang)}</p>
 <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={uiT('theme.title', lang)}>
 {THEME_MODES.map(mode => {
   const active = themeMode === mode;
   return (
     <button
       key={mode}
       type="button"
       role="radio"
       aria-checked={active}
       onClick={() => { void selectionHaptic(); setThemeMode(mode); }}
       className={`flex min-h-16 items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${active ? 'border-indigo-400/50 bg-indigo-500/15 text-white' : 'border-white/5 bg-slate-900/40 text-slate-300'}`}
     >
       <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-indigo-500/25 text-indigo-200' : 'bg-slate-800/70 text-slate-400'}`}>
         {themeIcons[mode]}
       </span>
       <span className="min-w-0">
         <span className="block text-sm font-semibold">{themeLabels[mode].label}</span>
         <span className="mt-0.5 block text-xs leading-snug text-slate-400">{themeLabels[mode].description}</span>
       </span>
       {active && <span className="ms-auto shrink-0 text-indigo-300">✓</span>}
     </button>
   );
 })}
 </div>
 <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
 <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400" />
 {uiT('theme.active', lang)}: {themeLabels[themeMode].label}
 </p>
 </div>

 {/* Language Selector */}
 <div className="border-b border-white/10 pb-6">
 <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
 <Globe2 className="w-5 h-5 text-indigo-400" />
 {t('about.langTitle', lang)}
 </h2>
  <div className="grid grid-cols-2 gap-2">
  {(['en','tr','de','fr','es','ar','it','pt'] as LangCode[]).map(l => (
 <button
 key={l}
 onClick={() => setLang(l)}
 className={`min-w-0 py-3 px-4 rounded-xl font-semibold tracking-wide text-xs border transition-all duration-200 flex items-center gap-2.5 ${
 lang === l
 ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-600/30'
 : 'bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-900 hover:text-white'
 }`}
 >
 <div className="shrink-0 drop-shadow-sm">{FLAGS[l]}</div>
 <span className="min-w-0 break-words text-start">{LANG_LABELS[l]}</span>
 {lang === l && <span className="ms-auto text-indigo-300">✓</span>}
 </button>
 ))}
 </div>
 </div>

  </div>}

  {/* About Developer & Feedback (Moved from right column) */}
  <div className="border-t border-white/10 pt-8 text-center flex flex-col items-center">
 <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-sm mb-4 p-0.5">
 <div className="w-full h-full bg-slate-900/40 rounded-full flex items-center justify-center">
 <Code2 className="w-8 h-8 text-indigo-400" />
 </div>
 </div>
 <h3 className="text-xl font-black text-white">Burak Taşcıoğlu</h3>
 <p className="text-slate-400 text-sm font-medium mt-1">{t('about.developer', lang)}</p>
 <div className="mt-3 inline-flex items-center justify-center px-3 py-1 bg-indigo-500/10 border border-white/5 rounded-full">
 <span className="text-indigo-400 text-xs font-semibold tracking-wider uppercase">Version 5.0</span>
 </div>

 <div className="w-full mt-8 p-6 bg-slate-950/60 rounded-xl border border-white/10 h-full flex flex-col justify-between">
 <div>
 <MessageSquare className="w-6 h-6 text-indigo-400 mx-auto mb-3" />
 <h4 className="font-semibold text-white mb-2">{t('about.feedbackTitle', lang)}</h4>
 <p className="text-xs text-slate-300 leading-relaxed mb-6">{t('about.feedbackMsg', lang)}</p>
 </div>
 <a
 href="mailto:brktsci1986@gmail.com?subject=SkyView App Feedback"
 className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-sm font-semibold transition active:scale-95 border border-white/5 hover:border-transparent"
 >
 <Mail className="w-4 h-4" /> {t('about.feedbackBtn', lang)}
 </a>
 </div>
  </div>

 </div>
 );
};
