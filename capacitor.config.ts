/// <reference types="@capacitor-community/safe-area" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.filmeja.app',
  appName: 'FilmeJá',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      // 0 makes the plugin's own showOnLaunch() a no-op (see its Android
      // source: `if (config.getLaunchShowDuration() == 0) return;`) — this
      // app already has a real native splash via the Android 12
      // SplashScreen theme (styles.xml + MainActivity's
      // installSplashScreen()). Without this, the plugin showed its own
      // *separate* splash view (using drawable/splash.png) right after,
      // so cold start looked like two splash screens back to back.
      launchShowDuration: 0,
    },
    SafeArea: {
      statusBarStyle: 'DARK',
      navigationBarStyle: 'DARK',
    },
    // Required alongside @capacitor-community/safe-area on Capacitor v8, per its setup docs.
    SystemBars: {
      insetsHandling: 'disable',
    },
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: true,
        twitter: false,
      },
    },
  },
  // iOS/WKWebView has no built-in equivalent of Android's adjustResize: by
  // default it scrolls the whole page content to keep a focused input
  // visible instead of resizing the viewport, which looks like the entire
  // chat "jumping" instead of just the input riding above the keyboard.
  // Scoped to iOS only via this platform override — Android already behaves
  // correctly and gets no Keyboard config at all here.
  ios: {
    plugins: {
      Keyboard: {
        resize: 'body',
        resizeOnFullScreen: true,
      },
    },
  },
};

export default config;
