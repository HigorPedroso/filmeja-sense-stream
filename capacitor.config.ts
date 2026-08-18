/// <reference types="@capacitor-community/safe-area" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.filmeja.app',
  appName: 'FilmeJá',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
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
};

export default config;
