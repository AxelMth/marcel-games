import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marcelgames.wordclimb',
  appName: 'wordclimb',
  webDir: 'out',
  plugins: {
    // No LiveUpdates: the plugin was configured here but never installed
    // natively, and it runs launch-time native code with fatalError paths even
    // when autoUpdateMethod is 'none'. Removed for the same reason as earthunt.
  },
};

export default config;
