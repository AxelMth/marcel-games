import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marcelgames.wordclimb',
  appName: 'wordclimb',
  webDir: 'out',
  plugins: {
    LiveUpdates: {
      appId: '860819d5',
      channel: 'Production',
      autoUpdateMethod: 'background',
      maxVersions: 2
    }
    // No AdMob: WordClimb ships ad-free (the @capacitor-community/admob plugin
    // is not a dependency of this app). If ads are added later, install the
    // plugin and re-add the AdMob config + native app IDs here.
  }
};

export default config;
