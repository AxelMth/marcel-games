import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marcelgames.earthunt',
  appName: 'earthunt',
  webDir: 'out',
  plugins: {
    // No LiveUpdates: the plugin runs native code at launch even with
    // autoUpdateMethod 'none' (LiveUpdatesPlugin.load() forces the lazy
    // implementation init, which contains fatalError paths), and no JS in this
    // repo ever calls LiveUpdates.sync(). It was pure launch-time risk for a
    // feature that was never used. To re-enable OTA later, reinstall the plugin
    // and call LiveUpdates.sync() explicitly from JS after the app has loaded.
    AdMob: {
      // App IDs are set in AndroidManifest.xml and Info.plist (same as earthunt app.json)
      androidAppId: 'ca-app-pub-6271901101573718~9313598215',
      iosAppId: 'ca-app-pub-6271901101573718~5878435021'
    }
  }
};

export default config;
