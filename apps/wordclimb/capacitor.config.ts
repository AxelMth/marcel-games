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
    },
    AdMob: {
      // App IDs are set in AndroidManifest.xml and Info.plist (same as earthunt app.json)
      androidAppId: 'ca-app-pub-6271901101573718~9313598215',
      iosAppId: 'ca-app-pub-6271901101573718~5878435021'
    }
  }
};

export default config;
