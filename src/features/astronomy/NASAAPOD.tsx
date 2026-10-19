import React, { useEffect, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { RefreshCw, AlertCircle, Maximize2, X, Download, Heart, List, ExternalLink } from 'lucide-react';
import { PageLoadingSkeleton } from '../../components/ui/Skeleton';

import { useApodQuery } from '../../hooks/queries/useApodQuery';
import { APODData, APODFetchError, getFallbackImages } from '../../services/apodService';
import { useAppStore } from '../../store/useAppStore';
import { readStorageJson, writeStorageJson } from '../../utils/featureStorage';
import { DataFreshness } from '../../components/ui/DataFreshness';
import { getSafeHttpsUrl, getSafeMediaUrl, getTrustedApodEmbedUrl, isSafeMp4Url } from '../../utils/safeUrl';
import { StandardModal } from '../../components/ui/Modal';

const APOD_FAVORITES_KEY = 'skyview_apod_favorites';

const getFavoriteApods = (): APODData[] => readStorageJson<APODData[]>(APOD_FAVORITES_KEY, []);

export const NASAAPOD: React.FC = () => {
  const { lang } = useAppStore();
  const { data, isLoading, error, refetch, isFetching } = useApodQuery(lang);
  const [showLightbox, setShowLightbox] = useState<boolean>(false);
  // F5.4: lightbox artık StandardModal (lightbox variant) — odak tuzağı/ESC/geri-tuşu
  // ve portal çıkışı tek tabandan; manuel ref + useFocusTrap kaldırıldı.
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favorites, setFavorites] = useState<APODData[]>(getFavoriteApods);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoritePreview, setFavoritePreview] = useState<APODData | null>(null);

  // F3.6: build the localized fallback list once per language instead of on
  // every render/call site.
  const fallbackImages = useMemo(() => getFallbackImages(lang), [lang]);

  const cycleFallback = () => {
    setFallbackIndex((prev) => (prev + 1) % fallbackImages.length);
  };

  const isError = !!error;
  const apod = isError ? fallbackImages[fallbackIndex] : data;
  const displayedApod = favoritePreview ?? apod;
  const apodDate = displayedApod?.date;
  const safeMediaUrl = getSafeMediaUrl(displayedApod?.url);
  const safeHdUrl = getSafeHttpsUrl(displayedApod?.hdurl);
  const trustedEmbedUrl = getTrustedApodEmbedUrl(displayedApod?.url);
  // noUncheckedIndexedAccess: fallback listesi sabit dolu
  const fallbackMediaUrl = fallbackImages[fallbackIndex]?.url ?? fallbackImages[0]?.url;

  useEffect(() => {
    const saved = getFavoriteApods();
    setFavorites(saved);
    setIsFavorite(Boolean(apodDate && saved.some(item => item.date === apodDate)));
  }, [apodDate]);

  const toggleFavorite = () => {
    if (!displayedApod) return;
    const saved = getFavoriteApods();
    const next = isFavorite
      ? saved.filter(item => item.date !== displayedApod.date)
      : [displayedApod, ...saved.filter(item => item.date !== displayedApod.date)].slice(0, 30);
    if (writeStorageJson(APOD_FAVORITES_KEY, next)) {
      setFavorites(next);
      setIsFavorite(!isFavorite);
    }
  };

  let statusMessageKey: string | null = null;
  let statusDetailKey: string | null = null;

  if (isError) {
    const status = error instanceof APODFetchError ? error.status : undefined;
    statusMessageKey = status === 429 ? 'apod.rateLimitMsg' :
                       status === 403 ? 'apod.authMsg' :
                       status && status >= 500 ? 'apod.serverMsg' :
                       'apod.offlineMsg';
    statusDetailKey = 'apod.showingArchive';
  } else if (data?.fetchError) {
    // F1.5: the live fetch failed but a cached picture is being shown; say which failure it was.
    statusMessageKey = data.fetchError.status === 429 ? 'apod.rateLimitMsg' :
                       data.fetchError.status === 403 ? 'apod.authMsg' :
                       data.fetchError.status && data.fetchError.status >= 500 ? 'apod.serverMsg' :
                       'apod.offlineMsg';
    statusDetailKey = 'apod.showingCached';
  } else if (isFetching && data) {
    statusMessageKey = 'apod.cooldownMsg';
    statusDetailKey = 'apod.showingCached';
  }

  if (isLoading && !data && !favoritePreview) {
    return <PageLoadingSkeleton media />;
  }

 return (
 <div className="space-y-6 max-w-4xl mx-auto animate-slide-up">
 {/* Tab Header Banner */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-app-panel/70 backdrop-blur-md p-4 sm:p-5 rounded-xl border border-white/5 shadow-sm">
 <div>
 <h1 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight uppercase flex items-center gap-2">
 🚀 {t('nav.apod', lang)}
 </h1>
 <p className="text-xs text-slate-400 mt-1">
 {t('apod.pageSubtitle', lang)}
 </p>
 {data && !favoritePreview && <DataFreshness className="mt-2" fetchedAt={data.fetchedAt} source={data.source} offline={data.isOfflineCache} lang={lang} />}
 </div>
  <div className="flex items-center gap-2 self-end sm:self-auto">
  <button
  type="button"
  onClick={() => setShowFavorites(value => !value)}
  aria-label={t('apod.showFavorites', lang)}
  aria-expanded={showFavorites}
  className={`w-12 min-h-12 rounded-lg border flex items-center justify-center transition-colors ${showFavorites ? 'border-indigo-400/50 bg-indigo-500/15 text-indigo-200' : 'border-white/10 bg-slate-900/60 text-slate-300'}`}
  >
  <List className="w-4 h-4" />
  </button>
  <button
  type="button"
  onClick={toggleFavorite}
  disabled={!displayedApod}
 aria-label={isFavorite ? t('apod.removeFavorite', lang) : t('apod.addFavorite', lang)}
 aria-pressed={isFavorite}
 className={`w-12 min-h-12 rounded-lg border flex items-center justify-center transition-colors ${isFavorite ? 'border-rose-400/50 bg-rose-500/15 text-rose-300' : 'border-white/10 bg-slate-900/60 text-slate-300'}`}
 >
 <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
 </button>
 <button
  type="button"
  disabled={isFetching}
  onClick={() => { void refetch(); }}
 className="min-h-12 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
 {t('apod.refresh', lang)}
 </button>
 </div>
 </div>

  {showFavorites && (
  <section className="rounded-xl border border-white/10 bg-slate-900/45 p-4">
  <div className="mb-3 flex items-center justify-between gap-3">
  <h2 className="text-sm font-semibold text-white">{t('apod.savedTitle', lang)}</h2>
  {favoritePreview && <button type="button" onClick={() => setFavoritePreview(null)} className="text-xs font-semibold text-indigo-300">{t('apod.backToday', lang)}</button>}
  </div>
  {favorites.length === 0 ? (
  <p className="text-xs text-slate-400">{t('apod.noFavorites', lang)}</p>
  ) : (
  <div className="max-h-48 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
  {favorites.map(item => (
  <button key={item.date} type="button" onClick={() => { setFavoritePreview(item); setShowFavorites(false); }} className="flex w-full items-center gap-3 rounded-lg border border-white/5 bg-slate-950/45 p-2 text-left">
  <img src={getSafeMediaUrl(item.url) ?? fallbackMediaUrl} alt="" loading="lazy" decoding="async" className="h-10 w-14 shrink-0 rounded-md object-cover" />
  <span className="min-w-0"><span className="block truncate text-xs font-medium text-slate-200">{item.title}</span><span className="block text-2xs text-slate-500">{item.date}</span></span>
  </button>
  ))}
  </div>
  )}
  </section>
  )}

   {statusMessageKey && (
  <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-400 text-xs">
  <div className="min-w-0 flex items-start gap-2">
  <AlertCircle className="w-4 h-4 shrink-0" />
  <span className="space-y-1">
  <span className="block">{t(statusMessageKey, lang)}</span>
  {statusDetailKey && <span className="block text-amber-300/80">{t(statusDetailKey, lang)}</span>}
  </span>
  </div>
  {isError && (
  <button
  type="button"
  onClick={cycleFallback}
  className="w-full sm:w-auto min-h-12 bg-amber-600/35 border border-amber-500/30 px-3 py-1 rounded-xl font-semibold hover:bg-amber-500/50 transition"
 >
  {t('apod.nextImage', lang)}
  </button>
  )}
  </div>
  )}

  {displayedApod && (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
 
 {/* Main Visual Display Card */}
 <div className="lg:col-span-7 bg-app-bg/60 border border-white/5 rounded-xl overflow-hidden shadow-sm relative group">
  {displayedApod.media_type === 'image' ? (
  <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
  <img
  src={safeMediaUrl ?? fallbackMediaUrl}
  alt={displayedApod.title}
  onClick={() => setShowLightbox(true)}
  loading="lazy"
  decoding="async"
  className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300"
  onError={(e) => {
    const img = e.currentTarget;
    if (img.dataset.fallbackApplied === 'true') return;
    img.dataset.fallbackApplied = 'true';
    const fallbackUrl = fallbackImages[0]?.url; // noUncheckedIndexedAccess: liste sabit dolu
    if (fallbackUrl) img.src = fallbackUrl;
  }}
  />
  
  {/* Image controls overlay */}
  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/70 via-transparent to-black/20 flex flex-col justify-between p-4">
  <div className="flex justify-end gap-2">
  <button
  type="button"
  onClick={() => setShowLightbox(true)}
  aria-label={t('apod.enlarge', lang)}
  className="pointer-events-auto w-12 h-12 rounded-lg bg-slate-950/80 border border-white/10 text-white cursor-pointer flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
  >
  <Maximize2 className="w-4 h-4" />
  </button>
  </div>
  {displayedApod.copyright && (
  <span className="text-2xs text-slate-300 font-medium">
  © {displayedApod.copyright}
  </span>
  )}
  </div>
  </div>

  ) : isSafeMp4Url(safeMediaUrl ?? undefined) ? (
  <div className="relative aspect-[16/9] w-full bg-black flex items-center justify-center">
  <video
  src={safeMediaUrl ?? undefined}
  controls
  autoPlay
  muted
  loop
  playsInline
  className="w-full h-full object-contain"
  />
  </div>
  ) : trustedEmbedUrl ? (
  <div className="relative aspect-[16/9] w-full bg-black">
  <iframe
  src={trustedEmbedUrl}
  title={displayedApod.title}
  className="w-full h-full border-0"
  sandbox="allow-scripts allow-same-origin allow-presentation"
  referrerPolicy="no-referrer"
  allow="fullscreen; picture-in-picture"
  allowFullScreen
  />
  </div>
  ) : (
  <div className="relative aspect-[16/9] w-full bg-black flex items-center justify-center p-6">
  {safeMediaUrl ? (
  <a
  href={safeMediaUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="min-h-12 inline-flex items-center gap-2 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-200"
  >
  <ExternalLink className="h-4 w-4" />
  {t('apod.openVideo', lang)}
  </a>
  ) : <AlertCircle className="h-7 w-7 text-slate-500" aria-hidden="true" />}
  </div>
  )}
 
 <div className="p-5 border-t border-white/5">
 <span className="font-mono text-2xs text-indigo-400 font-semibold bg-slate-800/30 border border-white/5 px-2 py-0.5 rounded-full">
 {displayedApod.date}
 </span>
 <h2 className="text-lg font-black text-white mt-2 leading-tight">
 {displayedApod.title}
 </h2>
 </div>
 </div>

 {/* Explanation Card */}
 <div className="lg:col-span-5 bg-app-panel/90 backdrop-blur-md border border-white/5 p-6 rounded-xl shadow-sm space-y-4">
 <h3 className="text-xs font-black uppercase text-indigo-400 tracking-widest border-b border-white/5 pb-2">
 🪐 {t('apod.sciExp', lang)}
 </h3>
 
 <p className="text-xs text-slate-300 leading-relaxed font-normal max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
 {displayedApod.explanation}
 </p>

 <div className="pt-2 border-t border-white/5 flex justify-between items-center text-2xs text-slate-500 font-semibold">
 <span>{t('apod.source', lang) + ':'} NASA APOD</span>
 {safeHdUrl && displayedApod.media_type === 'image' && (
 <a
 href={safeHdUrl}
 target="_blank"
 rel="noreferrer"
 className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline"
 >
 <Download className="w-3 h-3" />
 {t('apod.hdOriginal', lang)}
 </a>
 )}
 </div>
 </div>
 </div>
 )}

 {/* Lightbox full-screen modal (F5.4 StandardModal) */}
 <StandardModal
   open={showLightbox && displayedApod != null}
   onClose={() => setShowLightbox(false)}
   variant="lightbox"
   z={99999}
   ariaLabel={displayedApod?.title ?? ''}
 >
 {displayedApod && (
 <>
 <button
 type="button"
 onClick={() => setShowLightbox(false)}
 aria-label={t('common.close', lang)}
 className="absolute top-4 right-4 bg-slate-900 border border-white/10 text-white rounded-lg w-12 h-12 flex items-center justify-center cursor-pointer hover:bg-slate-800 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
 >
 <X className="w-5 h-5" />
 </button>

 <img
 src={safeHdUrl || safeMediaUrl || fallbackMediaUrl}
 alt={displayedApod.title}
 className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-sm"
 />
 </>
 )}
 </StandardModal>
 </div>
 );
};
