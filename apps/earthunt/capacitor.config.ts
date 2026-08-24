import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

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
    Keyboard: {
      // The game screen is a full-bleed map with absolutely-positioned overlays.
      // Letting the keyboard resize the web view (or letting WKWebView scroll to
      // reveal the focused field) drags the map up with the search bar. Keeping
      // the viewport at full height means only the search bar moves, driven by
      // visualViewport in useKeyboardOffset.
      resize: KeyboardResize.None
    }
  }
};

export default config;
