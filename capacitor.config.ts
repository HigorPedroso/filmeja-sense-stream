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
      launchShowDuration: 1500,
      backgroundColor: '#0f0f0f',
      androidSplashResourceName: 'splash',
      // Default is FIT_XY, which stretches the image to fill the screen
      // without preserving aspect ratio — visibly warps a centered icon on
      // screens whose aspect ratio doesn't match the splash image. CENTER_INSIDE
      // keeps the icon at its natural proportions, centered.
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
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
        apple: false,
        twitter: false,
      },
    },
  },
};

export default config;
