import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kodekenobi.blastova',
  appName: 'Blastova',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    backgroundColor: '#040c1b',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 0,
      backgroundColor: '#040c1b',
      androidSplashResourceName: 'launch_splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      androidScaleType: 'fitXY',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#040c1b',
      overlaysWebView: true,
    },
  },
};

export default config;
