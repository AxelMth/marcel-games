import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marcelgames.wordclimb',
  appName: 'wordclimb',
  webDir: 'out',
  plugins: {
    LiveUpdates: {
      appId: '860819d5',
      channel: 'Production',
      // 'none' (was 'background'): the automatic launch-time native sync can raise
      // an uncaught exception on restricted networks (e.g. App Store review),
      // crashing the app on launch. With 'none' no sync runs at launch. To
      // re-enable OTA later, call LiveUpdates.sync() from JS after load, guarded.
      autoUpdateMethod: 'none',
      maxVersions: 2
    }
    // No AdMob: WordClimb ships ad-free (the @capacitor-community/admob plugin
    // is not a dependency of this app). If ads are added later, install the
    // plugin and re-add the AdMob config + native app IDs here.
  }
};

export default config;
