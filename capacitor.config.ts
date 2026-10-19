import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.uzay.rehberi',
  appName: 'SkyView: Moon & Space Tracker',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    useLegacyBridge: false,
    minWebViewVersion: 105,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: false,
      // F6.1: uygulama gövdesiyle aynı koyu ton (--sv-bg) — açılışta tint adımı yok.
      backgroundColor: "#010204",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#6366f1",
    },
  },
};

export default config;
