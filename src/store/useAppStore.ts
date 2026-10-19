import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { LangCode, loadLanguage } from '../i18n';
import { AppRoute, LocationData, Tab } from '../types';
import { appStorage } from '../repositories/storageRepository';
import { rootRouteForTab, tabForRoute } from '../utils/navigation';
import { DEFAULT_THEME, isThemeMode, ThemeMode } from '../utils/theme';

// F1.3: tracks how the current location was chosen so startup GPS never
// silently overrides a location the user picked manually.
export type LocationSource = 'default' | 'manual' | 'gps';

export const DEFAULT_LOCATION: LocationData = {
  name: 'London, UK',
  latitude: 51.5074,
  longitude: -0.1278,
  timezone: 'Europe/London'
};

const STORE_KEY = 'skyview-app-store';

// F5.1: persisted blobs are versioned and migrated; merge only ever applies
// whitelisted keys so runtime-only fields (currentRoute, navigationStack) and
// vandalized/unknown data fall back to defaults instead of being spread in.
export const PERSIST_VERSION = 1;

const PERSISTED_KEYS = ['lang', 'nightMode', 'fieldMode', 'themeMode', 'activeTab', 'currentLocation', 'locationSource'] as const;

const LANG_CODES: readonly LangCode[] = ['tr', 'en', 'de', 'fr', 'es', 'ar', 'it', 'pt'];
const TAB_CODES: readonly Tab[] = ['today', 'sky', 'plan', 'settings'];
const LOCATION_SOURCES: readonly LocationSource[] = ['default', 'manual', 'gps'];

type PersistedAppState = Pick<AppState, typeof PERSISTED_KEYS[number]>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const sanitizeLang = (value: unknown): LangCode | null =>
  typeof value === 'string' && (LANG_CODES as readonly string[]).includes(value) ? (value as LangCode) : null;

const sanitizeBoolean = (value: unknown): boolean | null =>
  typeof value === 'boolean' ? value : null;

const sanitizeTab = (value: unknown): Tab | null =>
  typeof value === 'string' && (TAB_CODES as readonly string[]).includes(value) ? (value as Tab) : null;

const sanitizeLocationSource = (value: unknown): LocationSource | null =>
  typeof value === 'string' && (LOCATION_SOURCES as readonly string[]).includes(value) ? (value as LocationSource) : null;

const sanitizeLocation = (value: unknown): LocationData | null => {
  if (!isRecord(value)) return null;
  const name = value.name;
  const latitude = value.latitude;
  const longitude = value.longitude;
  const timezone = value.timezone;
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || Math.abs(latitude) > 90) return null;
  if (typeof longitude !== 'number' || !Number.isFinite(longitude) || Math.abs(longitude) > 180) return null;
  return {
    name: typeof name === 'string' ? name : '',
    latitude,
    longitude,
    timezone: typeof timezone === 'string' ? timezone : '',
  };
};

export const migratePersistedAppState = (persisted: unknown): Partial<PersistedAppState> => {
  if (!isRecord(persisted)) return {};
  const migrated: Partial<PersistedAppState> = {};
  const lang = sanitizeLang(persisted.lang);
  if (lang !== null) migrated.lang = lang;
  const nightMode = sanitizeBoolean(persisted.nightMode);
  if (nightMode !== null) migrated.nightMode = nightMode;
  const fieldMode = sanitizeBoolean(persisted.fieldMode);
  if (fieldMode !== null) migrated.fieldMode = fieldMode;
  if (isThemeMode(persisted.themeMode)) migrated.themeMode = persisted.themeMode;
  else if (nightMode === true) migrated.themeMode = 'scotopic';
  const activeTab = sanitizeTab(persisted.activeTab);
  if (activeTab !== null) migrated.activeTab = activeTab;
  const location = sanitizeLocation(persisted.currentLocation);
  if (location !== null) migrated.currentLocation = location;
  const locationSource = sanitizeLocationSource(persisted.locationSource);
  if (locationSource !== null) migrated.locationSource = locationSource;
  return migrated;
};

interface AppState {
  lang: LangCode;
  nightMode: boolean;
  fieldMode: boolean;
  themeMode: ThemeMode;
  activeTab: Tab;
  currentLocation: LocationData;
  locationSource: LocationSource;
  currentRoute: AppRoute;
  navigationStack: AppRoute[];
  setLang: (lang: LangCode) => void;
  setNightMode: (nightMode: boolean) => void;
  setFieldMode: (fieldMode: boolean) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  setActiveTab: (activeTab: Tab) => void;
  setCurrentLocation: (location: LocationData) => void;
  setLocationSource: (source: LocationSource) => void;
  navigateToRoute: (route: AppRoute) => void;
  goBack: () => boolean;
}

const hasPersistedStore = (): boolean => {
  if (typeof window === 'undefined') return false;
  return appStorage.getString(STORE_KEY) !== null;
};

const getLegacyLang = (): LangCode | null => {
  if (typeof window !== 'undefined' && !hasPersistedStore()) {
    const saved = appStorage.getString('app_lang');
    if (['tr','en','de','fr','es','ar','it','pt'].includes(saved || '')) return saved as LangCode;
  }
  return null;
};

const getLegacyNightMode = (): boolean | null => {
  if (typeof window !== 'undefined' && !hasPersistedStore()) {
    return appStorage.getString('night_mode') === '1';
  }
  return null;
};

const getLegacyActiveTab = (): Tab | null => {
  if (typeof window !== 'undefined' && !hasPersistedStore()) {
    const saved = appStorage.getString('skyview_active_tab');
    if (['today', 'sky', 'plan', 'settings'].includes(saved || '')) return saved as Tab;
  }
  return null;
};

const getLegacyLocation = (): LocationData | null => {
  if (typeof window !== 'undefined' && !hasPersistedStore()) {
    const saved = appStorage.getString('skyview_active_location');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          return parsed;
        }
      } catch (e) {
        console.warn("Could not parse saved location");
      }
    }
  }
  return null;
};

const legacyInitialState = {
  lang: getLegacyLang(),
  nightMode: getLegacyNightMode(),
  activeTab: getLegacyActiveTab(),
  currentLocation: getLegacyLocation(),
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      lang: legacyInitialState.lang ?? 'tr',
      nightMode: legacyInitialState.nightMode ?? false,
      fieldMode: false,
      themeMode: legacyInitialState.nightMode ? 'scotopic' : DEFAULT_THEME,
      activeTab: legacyInitialState.activeTab ?? 'today',
      currentLocation: legacyInitialState.currentLocation ?? DEFAULT_LOCATION,
      locationSource: 'default',
      currentRoute: rootRouteForTab(legacyInitialState.activeTab ?? 'today'),
      navigationStack: [rootRouteForTab(legacyInitialState.activeTab ?? 'today')],
      setLang: (lang) => {
        void loadLanguage(lang)
          .then(() => set({ lang }))
          .catch(error => console.warn(`Language pack ${lang} could not be loaded.`, error));
      },
      // Geriye dönük uyum: eski gece modu düğmesi artık scotopic profiline
      // bağlanır; kapatınca kullanıcının son teması korunur.
      setNightMode: (nightMode) => set(state => ({
        nightMode,
        themeMode: nightMode
          ? 'scotopic'
          : (state.themeMode === 'scotopic' ? DEFAULT_THEME : state.themeMode),
      })),
      setFieldMode: (fieldMode) => set({ fieldMode }),
      setThemeMode: (themeMode) => set({ themeMode, nightMode: themeMode === 'scotopic' }),
      setActiveTab: (activeTab) => {
        const currentRoute = rootRouteForTab(activeTab);
        set({ activeTab, currentRoute, navigationStack: [currentRoute] });
      },
      setCurrentLocation: (currentLocation) => set({ currentLocation }),
      setLocationSource: (locationSource) => set({ locationSource }),
      navigateToRoute: (currentRoute) => set((state) => {
        const activeTab = tabForRoute(currentRoute);
        const rootRoute = rootRouteForTab(activeTab);
        if (currentRoute === rootRoute) {
          return { activeTab, currentRoute, navigationStack: [rootRoute] };
        }
        const sameSection = state.activeTab === activeTab && state.navigationStack[0] === rootRoute;
        const baseStack = sameSection ? state.navigationStack : [rootRoute];
        const navigationStack = baseStack.at(-1) === currentRoute
          ? baseStack
          : [...baseStack, currentRoute];
        return { activeTab, currentRoute, navigationStack };
      }),
      goBack: () => {
        let handled = false;
        set((state) => {
          if (state.navigationStack.length <= 1) return state;
          const navigationStack = state.navigationStack.slice(0, -1);
          const currentRoute = navigationStack.at(-1) ?? 'today';
          handled = true;
          return { navigationStack, currentRoute, activeTab: tabForRoute(currentRoute) };
        });
        return handled;
      },
    }),
    {
      name: STORE_KEY,
      version: PERSIST_VERSION,
      migrate: (persisted) => migratePersistedAppState(persisted) as AppState,
      storage: createJSONStorage(() => ({
        getItem: key => appStorage.getString(key),
        setItem: (key, value) => { appStorage.setString(key, value); },
        removeItem: key => { appStorage.remove(key); },
      })),
      partialize: (state) => ({
        lang: state.lang,
        nightMode: state.nightMode,
        fieldMode: state.fieldMode,
        themeMode: state.themeMode,
        activeTab: state.activeTab,
        currentLocation: state.currentLocation,
        locationSource: state.locationSource,
      }),
      merge: (persisted, current) => {
        const migrated = migratePersistedAppState(persisted) as Partial<AppState>;
        const merged = { ...current, ...migrated };
        const currentRoute = rootRouteForTab(merged.activeTab);
        return { ...merged, currentRoute, navigationStack: [currentRoute] };
      },
    }
  )
);
