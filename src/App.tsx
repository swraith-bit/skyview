import { useEffect, useRef, useState, Suspense, lazy, ReactNode } from 'react';
import { Tab } from './types';
import { t } from './i18n';
import {
 Compass,
 Home,
 Telescope,
 CalendarCheck,
 Settings,
 RefreshCw,
 Navigation,
} from 'lucide-react';
import { LangCode } from './i18n';
import { App as CapacitorApp } from '@capacitor/app';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { PageLoadingSkeleton } from './components/ui/Skeleton';
import { evaluateSmartNotifications } from './utils/smartNotifications';
import { useWeatherQuery } from './hooks/queries/useWeatherQuery';
import { useAppStore } from './store/useAppStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getCurrentLocationFallbackName, resolveLocationName } from './utils/locationName';
import { selectionHaptic } from './utils/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { isAppRoute, parseAppRouteUrl } from './utils/navigation';
import { markAppReady } from './utils/performanceMonitor';
import { getNotificationPreferences } from './utils/featureStorage';
import { syncBackgroundAlerts } from './native/backgroundAlerts';
import { resolveTimezoneForCoordinates } from './utils/locationTimezone';
import { useWakeLock } from './hooks/useWakeLock';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { WEATHER_ERROR_KEYS, classifyWeatherError } from './utils/weatherErrors';
import { consumeBackButtonModal } from './utils/backButtonRegistry';
import { OfflineStatusBanner } from './components/ui/OfflineStatusBanner';
import { ToastHost } from './components/ui/Toast';
import { CosmicDock, CosmicDockItem } from './components/ui/CosmicDock';
import { resolveTheme } from './utils/theme';
import { uiT } from './i18nUi';
import { addScotopicTileListener, readScotopicTile, syncScotopicTile } from './native/scotopicTile';

const TodayDashboard = lazy(() => import('./features/core/TodayDashboard').then(module => ({ default: module.TodayDashboard })));
const SkyHub = lazy(() => import('./features/core/SkyHub').then(module => ({ default: module.SkyHub })));
const PlanHub = lazy(() => import('./features/core/PlanHub').then(module => ({ default: module.PlanHub })));
const SettingsHub = lazy(() => import('./features/settings/SettingsHub').then(module => ({ default: module.SettingsHub })));

// Module-scoped modal stack for hardware back button (SEC-3: avoids global window mutation)
export default function App() {
  const { lang, themeMode, fieldMode, activeTab, currentRoute, setActiveTab, setThemeMode, currentLocation, setCurrentLocation, setLocationSource, navigateToRoute } = useAppStore();
  // TUR 2: sahada scotopic zorunlu; diğer durumda kullanıcının tema tercihi.
  const effectiveTheme = resolveTheme(themeMode, fieldMode);
  // F3.6: rounded coordinate key — background alert syncs key off stable rounded
  // coordinates instead of the currentLocation object identity (GPS fixes no
  // longer spawn redundant WorkManager syncs).
  const locationCoordsKey = `${currentLocation.latitude.toFixed(4)},${currentLocation.longitude.toFixed(4)}`;
  useWakeLock(fieldMode);
  const isOnline = useNetworkStatus();
  // F1.3: manual-location GPS consent chip + startup GPS flow handle
  const [gpsOfferVisible, setGpsOfferVisible] = useState(false);
  // Faz 6.2: karo durumu okunmadan tema senkronu yazmayalım (açılış yarışı).
  const [nativeThemeReady, setNativeThemeReady] = useState(Capacitor.getPlatform() !== 'android');
  const nameAbortRef = useRef<AbortController | null>(null);
  const resolveStartupRef = useRef<((mode: 'auto' | 'userInitiated') => Promise<void>) | null>(null);

  useEffect(() => {
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        markAppReady();
        if (Capacitor.isNativePlatform()) {
          SplashScreen.hide().catch(error => console.warn('SplashScreen hide failed:', error));
        }
      });
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
    };
  }, []);

  // Faz 6.2: uygulama ile Quick Settings kırmızı mod karosu tek kaynağı paylaşır.
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;
    let disposed = false;
    let subscription: Awaited<ReturnType<typeof addScotopicTileListener>> = null;
    void (async () => {
      const tileEnabled = await readScotopicTile();
      if (disposed) return;
      if (tileEnabled) setThemeMode('scotopic');
      setNativeThemeReady(true);
      subscription = await addScotopicTileListener(enabled => {
        const current = useAppStore.getState().themeMode;
        setThemeMode(enabled ? 'scotopic' : (current === 'scotopic' ? 'deep-space' : current));
        void selectionHaptic();
      });
      if (disposed) {
        await subscription?.remove();
        subscription = null;
      }
    })();
    return () => {
      disposed = true;
      void subscription?.remove();
      subscription = null;
    };
  }, [setThemeMode]);

  useEffect(() => {
    if (!nativeThemeReady) return;
    void syncScotopicTile(themeMode === 'scotopic');
  }, [nativeThemeReady, themeMode]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      // Semantik tema motoru: tek `data-theme` özniteliği tüm token'ları çevirir.
      document.documentElement.dataset.theme = effectiveTheme;
      document.documentElement.classList.toggle('night-mode-active', effectiveTheme === 'scotopic');
      // Android durum çubuğu rengi temayla aynı adımda değişsin.
      const themeColor = effectiveTheme === 'daylight' ? '#eef2f8' : effectiveTheme === 'deep-space' ? '#010204' : '#000000';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
    }
  }, [effectiveTheme, lang]);

  const { data: obsData, isLoading: weatherLoading, error, isError, refetch: refetchWeather } = useWeatherQuery(currentLocation, lang);
  const wasOnlineRef = useRef(isOnline);
  // F6.9: pull-to-refresh — main kaydırma konteynerine bağlı; yalnızca tepeden
  // aşağı-çekimde hava sorgusu yeniden çalıştırılır.
  const [mainContainer, setMainContainer] = useState<HTMLElement | null>(null);
  const { pullDistance, isRefreshing: pullRefreshing } = usePullToRefresh(
    mainContainer,
    () => refetchWeather(),
  );

  useEffect(() => {
    if (!wasOnlineRef.current && isOnline) {
      void refetchWeather();
    }
    wasOnlineRef.current = isOnline;
  }, [isOnline, refetchWeather]);
  
  // F4.5: real error channels (offline / timeout / server / unavailable) instead of
  // the dead 'FETCH_FAILED' branch that rendered "check your connection" for every
  // failure, including provider outages.
  const weatherError = isError
    ? t(WEATHER_ERROR_KEYS[classifyWeatherError(error, isOnline)], lang)
    : null;
  const isOfflineData = obsData?.isOfflineCache === true;

  // System integrations
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setTimeout(async () => {
        try {
          await StatusBar.show();
          await StatusBar.setOverlaysWebView({ overlay: true });
          await StatusBar.setBackgroundColor({ color: '#00000000' });
          await StatusBar.setStyle({ style: effectiveTheme === 'daylight' ? Style.Dark : Style.Light });
        } catch (err) {
          console.warn('StatusBar error:', err);
        }
      }, 300);
    }

    const backButtonListener = CapacitorApp.addListener('backButton', () => {
    // F5.3: modal geri-tuşu kayıt yığını; DOM gözcü id sorgusu bitti.
    if (consumeBackButtonModal()) return;
    const appState = useAppStore.getState();
    if (appState.goBack()) return;
      const currentTab = appState.activeTab;
      if (currentTab !== 'today') {
        setActiveTab('today');
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      backButtonListener.then(listener => listener.remove()).catch(console.error);
    };
  }, [effectiveTheme, setActiveTab]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const notificationListener = LocalNotifications.addListener('localNotificationActionPerformed', action => {
      const route = action.notification.extra?.route;
      if (isAppRoute(route)) navigateToRoute(route);
    });
    const urlListener = CapacitorApp.addListener('appUrlOpen', event => {
      const route = parseAppRouteUrl(event.url);
      if (route) navigateToRoute(route);
    });
    // F1.7: consume the cold-start launch URL; a deep link opened from preview can beat
    // the appUrlOpen listener subscription and otherwise be dropped.
    void CapacitorApp.getLaunchUrl().then(launch => {
      if (!launch?.url) return;
      const route = parseAppRouteUrl(launch.url);
      if (route) navigateToRoute(route);
    }).catch(error => console.warn('getLaunchUrl failed', error));
    return () => {
      void notificationListener.then(listener => listener.remove());
      void urlListener.then(listener => listener.remove());
    };
  }, [navigateToRoute]);

 useEffect(() => {
 if (!Capacitor.isNativePlatform()) return;
 let active = true;
 const nameController = new AbortController();
 nameAbortRef.current = nameController;
 const resolveStartupLocation = async (mode: 'auto' | 'userInitiated' = 'auto') => {
  if (mode === 'auto' && useAppStore.getState().locationSource === 'manual') {
   // Never silently override a location the user picked manually (F1.3).
   setGpsOfferVisible(true);
   return;
  }
 try {
  const permission = await Geolocation.checkPermissions();
  let locationPermission = permission.location;
  if (locationPermission !== 'granted') {
  const requested = await Geolocation.requestPermissions();
  locationPermission = requested.location;
  }

  if (locationPermission !== 'granted') return;

  const position = await Geolocation.getCurrentPosition({
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 10 * 60 * 1000
  });
  if (!active) return;

    const latitude = Number(position.coords.latitude.toFixed(4));
    const longitude = Number(position.coords.longitude.toFixed(4));
    // F1.3: derive the timezone from the coordinates instead of the device timezone;
    // the latter only serves as fallback while resolving.
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setCurrentLocation({
      name: getCurrentLocationFallbackName(lang),
      latitude,
      longitude,
      timezone,
    });
    setLocationSource('gps');
    void resolveTimezoneForCoordinates(latitude, longitude).then(timezone => {
      const selectedLocation = useAppStore.getState().currentLocation;
      if (!active) return;
      if (selectedLocation.latitude !== latitude || selectedLocation.longitude !== longitude) return;
      if (selectedLocation.timezone === timezone) return;
      setCurrentLocation({ ...selectedLocation, timezone });
    });
    void resolveLocationName(latitude, longitude, lang, nameController.signal).then(name => {
      if (!active) return;
      const selectedLocation = useAppStore.getState().currentLocation;
      if (selectedLocation.latitude !== latitude || selectedLocation.longitude !== longitude) return;
      setCurrentLocation({ ...selectedLocation, name });
    });
  } catch (error) {
 console.warn('Startup geolocation failed; using saved/default location', error);
 }
 };
 
 resolveStartupLocation();
 resolveStartupRef.current = resolveStartupLocation;
 return () => {
 active = false;
 nameAbortRef.current = null;
 nameController.abort();
 };
 // Run once on startup so manual location changes do not trigger another permission prompt.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

  useEffect(() => {
    if (Capacitor.getPlatform() === 'android') {
      syncBackgroundAlerts(getNotificationPreferences(), useAppStore.getState().currentLocation, lang).catch(error => console.warn('Background alert sync failed', error));
    }
    // F3.6: rounded coords key — object identity no longer drives re-syncs.
  }, [locationCoordsKey, lang]);

  useEffect(() => {
    if (!obsData || Capacitor.getPlatform() === 'android') return;
    evaluateSmartNotifications(obsData, lang, useAppStore.getState().currentLocation.timezone, locationCoordsKey).catch(error => console.warn('Smart alert evaluation failed', error));
  }, [locationCoordsKey, lang, obsData]);




 const isCloudy = obsData && obsData.cloudCover > 60;
 const isRtl = lang === 'ar';
 const navigate = (tab: Tab) => { void selectionHaptic(); setActiveTab(tab); };
 const dockItems: CosmicDockItem[] = [
   { id: 'today', label: navLabel('today', lang), icon: <Home className="h-5 w-5" />, active: activeTab === 'today', onSelect: () => navigate('today') },
   { id: 'sky', label: navLabel('sky', lang), icon: <Telescope className="h-5 w-5" />, active: activeTab === 'sky' && currentRoute !== 'sky:ar', onSelect: () => navigate('sky') },
   { id: 'ar', label: uiT('dock.ar', lang), icon: <Navigation className="h-6 w-6" />, active: currentRoute === 'sky:ar', emphasis: true, onSelect: () => { void selectionHaptic(); navigateToRoute('sky:ar'); } },
   { id: 'plan', label: navLabel('plan', lang), icon: <CalendarCheck className="h-5 w-5" />, active: activeTab === 'plan', onSelect: () => navigate('plan') },
   { id: 'settings', label: navLabel('settings', lang), icon: <Settings className="h-5 w-5" />, active: activeTab === 'settings', onSelect: () => navigate('settings') },
 ];

 return (
 <div dir={isRtl ? 'rtl' : 'ltr'} className={`h-[100dvh] overflow-hidden w-full text-slate-100 flex flex-col md:flex-row font-sans transition-colors duration-1000 ${isCloudy ? 'bg-app-bg-cloudy' : 'bg-app-bg'}`}>

 {/* Scotopic red overlay — yalnız kırmızı profil etkinken */}
 {effectiveTheme === 'scotopic' && (
 <div className="night-mode-overlay pointer-events-none fixed inset-0 z-[100000] mix-blend-multiply"
 style={{ background: 'rgba(220,0,0,0.82)' }} />
 )}

 {/* Calm, static background keeps data legible and avoids continuous GPU work. */}
 <div className={`absolute inset-0 pointer-events-none z-0 ${isCloudy ? 'bg-app-bg-cloudy' : 'bg-app-bg'}`} />

 {/* Side Navigation Rail for Tablet/Desktop */}
 <nav className="hidden md:flex flex-col w-24 shrink-0 overflow-y-auto border-e border-white/5 bg-app-nav/90 backdrop-blur-md z-20 items-center py-8 gap-6 shadow-[4px_0_24px_rgba(0,0,0,0.35)]">
 <div className="w-12 h-12 bg-slate-800/30 border border-white/5 rounded-xl flex items-center justify-center text-indigo-400 mb-2 shadow-inner shadow-indigo-500/10">
 <Compass className="w-6 h-6" />
 </div>
 
 <NavButton active={activeTab === 'today'} onClick={() => navigate('today')} icon={<Home className="w-6 h-6" />} label={navLabel('today', lang)} />
 <NavButton active={activeTab === 'sky'} onClick={() => navigate('sky')} icon={<Telescope className="w-6 h-6" />} label={navLabel('sky', lang)} />
 <NavButton active={activeTab === 'sky' && currentRoute === 'sky:ar'} onClick={() => { void selectionHaptic(); navigateToRoute('sky:ar'); }} icon={<Navigation className="w-6 h-6" />} label={uiT('dock.ar', lang)} />
 <NavButton active={activeTab === 'plan'} onClick={() => navigate('plan')} icon={<CalendarCheck className="w-6 h-6" />} label={navLabel('plan', lang)} />
 <NavButton active={activeTab === 'settings'} onClick={() => navigate('settings')} icon={<Settings className="w-6 h-6" />} label={navLabel('settings', lang)} />
 </nav>

 {/* Main Content Area */}
 <main ref={setMainContainer} className="flex-1 min-h-0 min-w-0 relative z-10 overflow-y-auto overflow-x-hidden md:p-8 p-4 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] md:pb-8 pt-safe-area">

 {/* F6.9: pull-to-refresh indikatörü — yalnızca çekim/yenileme sırasında görür */}
 {(pullDistance > 0 || pullRefreshing) && (
   <div className="pointer-events-none sticky top-0 z-30 flex justify-center pt-2" role={pullRefreshing ? 'status' : undefined}>
     <div
       className="flex min-h-8 items-center gap-2 rounded-full border border-white/10 bg-slate-900/85 px-3 py-1.5 text-xs text-slate-200 shadow-lg backdrop-blur"
       style={{ opacity: pullRefreshing ? 1 : Math.min(1, pullDistance / 40) }}
     >
       <RefreshCw size={14} aria-hidden="true" className={pullRefreshing ? 'animate-spin' : undefined} />
       {pullRefreshing && <span className="text-2xs">{t('refresh.inProgress', lang)}</span>}
     </div>
   </div>
 )}

 <OfflineStatusBanner lang={lang} networkOffline={!isOnline} cachedData={isOfflineData} onRetry={() => { void refetchWeather(); }} />

 {/* F1.3: one-shot consent chip when a manually selected location exists at startup */}
 {gpsOfferVisible && (
   <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-950/50 px-3 py-2 text-xs text-indigo-200" role="status">
     <span className="min-w-0 flex-1">{t('location.gpsUpdatePrompt', lang)}</span>
     <button type="button" onClick={() => { setGpsOfferVisible(false); void resolveStartupRef.current?.('userInitiated'); }} className="min-h-10 rounded-lg bg-indigo-600/80 px-3 py-1 font-semibold text-white hover:bg-indigo-600">
       {t('location.gpsUpdateConfirm', lang)}
     </button>
     <button type="button" onClick={() => setGpsOfferVisible(false)} className="min-h-10 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1 font-semibold text-slate-300 hover:bg-slate-800">
       {t('location.gpsUpdateDismiss', lang)}
     </button>
   </div>
 )}
 
 {activeTab !== 'today' && <header className="mb-6 md:hidden min-w-0"><h1 className="text-lg font-semibold text-white">{navLabel(activeTab, lang)}</h1></header>}

        <div className="w-full max-w-5xl mx-auto min-h-full">
          <ErrorBoundary resetKey={activeTab} fullScreen={false}>
            <Suspense fallback={<PageLoadingSkeleton />}>
              {activeTab === 'today' && (
                <div key="today" className="app-page-enter">
                  <TodayDashboard
                    observation={obsData ?? null}
                    loading={weatherLoading}
                    error={weatherError}
                    isOfflineData={isOfflineData}
                    onRefresh={() => { void refetchWeather(); }}
                  />
                </div>
              )}

              {activeTab === 'sky' && (
                <div key="sky" className="app-page-enter">
                  <SkyHub
                    hourly={obsData?.hourly || null}
                    cloudCover={obsData?.cloudCover ?? 50}
                  />
                </div>
              )}

              {activeTab === 'plan' && (
                <div key="plan" className="app-page-enter">
                  <PlanHub />
                </div>
              )}

              {activeTab === 'settings' && (
                <div key="settings" className="app-page-enter">
                  <SettingsHub />
                </div>
              )}
            </Suspense>
          </ErrorBoundary>
        </div>
 </main>

 {/* TUR 2: yüzen kozmik dock — merkezde tek dokunuşla AR vizörü. */}
 <CosmicDock ariaLabel={uiT('a11y.dock', lang)} items={dockItems} />

 {/* F6.2: single app-wide toast channel (portal target lives at document.body). */}
 <ToastHost />
 </div>
 );
}

// Side Rail Button
function NavButton({ active, icon, label, onClick }: { active: boolean, icon: ReactNode, label: string, onClick: () => void }) {
 return (
 <button onClick={onClick} aria-label={label} aria-current={active ? 'page' : undefined} className="flex min-h-16 flex-col items-center gap-1.5 group outline-none w-full focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg">
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${active ? 'bg-indigo-600 shadow-sm shadow-indigo-600/30 text-white' : 'bg-transparent text-slate-500 group-hover:bg-slate-900 group-hover:text-slate-300'}`}>
 {icon}
 </div>
 <span className={`text-2xs font-semibold tracking-wide uppercase ${active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
 {label}
 </span>
 </button>
 );
}


const NAV_LABELS: Record<LangCode, Record<Tab, string>> = {
  tr: { today: 'Bugün', sky: 'Gökyüzü', plan: 'Planla', settings: 'Profil' },
  en: { today: 'Today', sky: 'Sky', plan: 'Plan', settings: 'Profile' },
  de: { today: 'Heute', sky: 'Himmel', plan: 'Planen', settings: 'Profil' },
  fr: { today: "Aujourd'hui", sky: 'Ciel', plan: 'Planifier', settings: 'Profil' },
  es: { today: 'Hoy', sky: 'Cielo', plan: 'Planear', settings: 'Perfil' },
  ar: { today: 'اليوم', sky: 'السماء', plan: 'خطط', settings: 'الملف' },
  it: { today: 'Oggi', sky: 'Cielo', plan: 'Pianifica', settings: 'Profilo' },
  pt: { today: 'Hoje', sky: 'Céu', plan: 'Planejar', settings: 'Perfil' },
};

function navLabel(tab: Tab, lang: LangCode) {
  return NAV_LABELS[lang][tab];
}
