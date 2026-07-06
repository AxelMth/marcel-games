import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marcelgames.earthunt',
  appName: 'earthunt',
  webDir: 'out',
  plugins: {
    LiveUpdates: {
      appId: '64ef723b',
      channel: 'Production',
      // 'none' (was 'background'): the automatic launch-time native sync raised
      // an uncaught exception on the App Store review device (restricted network),
      // crashing the app on launch (SIGABRT). With 'none' no sync runs at launch.
      // To re-enable OTA later, call LiveUpdates.sync() from JS after the app has
      // loaded, wrapped in try/catch, and validate it on a poor network first.
      autoUpdateMethod: 'none',
      maxVersions: 2
    },
    AdMob: {
      // App IDs are set in AndroidManifest.xml and Info.plist (same as earthunt app.json)
      androidAppId: 'ca-app-pub-6271901101573718~9313598215',
      iosAppId: 'ca-app-pub-6271901101573718~5878435021'
    }
  }
};

export default config;
