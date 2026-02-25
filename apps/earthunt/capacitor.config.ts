import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marcelgames.earthunt',
  appName: 'earthunt',
  webDir: 'out',
  plugins: {
    LiveUpdates: {
      appId: '64ef723b',
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
