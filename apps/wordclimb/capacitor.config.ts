import type { CapacitorConfig } from '@capacitor/cli';

// Keep in step with lib/ad-constants.ts and the two native files.
// lib/ad-native-config.test.ts fails if they drift apart.
const ADMOB_IOS_APP_ID = 'ca-app-pub-6271901101573718~8478860820';
const ADMOB_ANDROID_APP_ID = 'ca-app-pub-6271901101573718~9736102177';

const config: CapacitorConfig = {
  appId: 'com.marcelgames.wordclimb',
  appName: 'wordclimb',
  webDir: 'out',
  plugins: {
    // No LiveUpdates: the plugin was configured here but never installed
    // natively, and it runs launch-time native code with fatalError paths even
    // when autoUpdateMethod is 'none'. Removed for the same reason as earthunt.
    AdMob: {
      // The values the SDK actually reads at launch live in the native files —
      // GADApplicationIdentifier in ios/App/App/Info.plist and
      // com.google.android.gms.ads.APPLICATION_ID in AndroidManifest.xml.
      // Omitting either crashes the app on launch; that is exactly what got
      // EarthHunt rejected by Apple.
      iosAppId: ADMOB_IOS_APP_ID,
      androidAppId: ADMOB_ANDROID_APP_ID,
    },
  },
};

export default config;
