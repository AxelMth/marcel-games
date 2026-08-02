import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marcelgames.wordclimb',
  appName: 'wordclimb',
  webDir: 'out',
  plugins: {
    // No LiveUpdates: the plugin was configured here but never installed
    // natively, and it runs launch-time native code with fatalError paths even
    // when autoUpdateMethod is 'none'. Removed for the same reason as earthunt.
    //
    // AdMob is not wired yet. When ads land, install
    // @capacitor-community/admob and set GADApplicationIdentifier in
    // Info.plist plus APPLICATION_ID in AndroidManifest.xml — those native keys
    // are what the SDK actually reads, and omitting them crashes at launch.
  }
};

export default config;
