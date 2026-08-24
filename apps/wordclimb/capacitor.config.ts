import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.marcelgames.wordclimb',
  appName: 'wordclimb',
  webDir: 'out',
  plugins: {
    // No LiveUpdates: the plugin was configured here but never installed
    // natively, and it runs launch-time native code with fatalError paths even
    // when autoUpdateMethod is 'none'. Removed for the same reason as earthunt.
    Keyboard: {
      // The play screen pins its input bar to the bottom of a full-height
      // (h-svh) column. Letting WKWebView scroll to reveal the focused field
      // drags the whole page up, which puts the top bar behind the status bar
      // and the notch. Keeping the web view at full height means only the
      // input bar moves, driven by useKeyboardOffset — same setup as earthunt.
      resize: KeyboardResize.None,
    },
  },
};

export default config;
