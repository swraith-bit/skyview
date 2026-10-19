import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import '@fontsource-variable/outfit';
import '@fontsource-variable/jetbrains-mono';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { initializeI18n, isLangCode } from './i18n.ts';
import { captureException, installGlobalObservability } from './observability/diagnostics.ts';
import { appStorage } from './repositories/storageRepository.ts';
import { TimeMachineProvider } from './context/TimeMachineContext.tsx';
import { isThemeMode, resolveTheme } from './utils/theme.ts';

const startApplication = async () => {
  await appStorage.initialize();
  const persisted = appStorage.getJson<{ state?: { lang?: unknown; themeMode?: unknown; fieldMode?: unknown; nightMode?: unknown } } | null>('skyview-app-store', null);
  const legacyLanguage = appStorage.getString('app_lang');
  const initialLanguage = isLangCode(persisted?.state?.lang)
    ? persisted.state.lang
    : isLangCode(legacyLanguage) ? legacyLanguage : 'tr';
  // TUR 2: ilk boyamadan önce temayı uygula — açılışta koyu kare parlamasını önler.
  const storedTheme = isThemeMode(persisted?.state?.themeMode) ? persisted.state.themeMode : null;
  const storedNightMode = persisted?.state?.nightMode === true;
  const initialTheme = resolveTheme(
    storedTheme ?? (storedNightMode ? 'scotopic' : 'deep-space'),
    persisted?.state?.fieldMode === true,
  );
  document.documentElement.dataset.theme = initialTheme;
  if (initialTheme === 'scotopic') document.documentElement.classList.add('night-mode-active');
  await initializeI18n(initialLanguage);
  const { default: App } = await import('./App.tsx');

  installGlobalObservability();

  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => captureException(error, 'network', { query: String(query.queryKey[0] ?? 'unknown') }),
    }),
    mutationCache: new MutationCache({
      onError: error => captureException(error, 'network', { type: 'mutation' }),
    }),
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <TimeMachineProvider>
            <App />
          </TimeMachineProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </StrictMode>,
  );
};

void startApplication().catch(error => {
  console.error('Application bootstrap failed.', error);
  // F1.7: the splash screen has auto-hide disabled in capacitor.config, so bootstrap
  // failures must release it explicitly or the user would stare at the splash forever.
  if (Capacitor.isNativePlatform()) {
    SplashScreen.hide().catch(hideError => console.warn('SplashScreen hide failed:', hideError));
  }
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = [
      '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#010204;color:#e2e8f0;font-family:system-ui,sans-serif;padding:24px;text-align:center;">',
      '<div style="max-width:320px;">',
      '<h1 style="font-size:18px;margin:0 0 8px;">SkyView could not start.</h1>',
      '<p style="font-size:13px;opacity:.7;margin:0;">Please close and reopen the app. If the problem continues, reinstall or clear app data.</p>',
      '</div></div>',
    ].join('');
  }
});
