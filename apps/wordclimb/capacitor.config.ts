import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.marcelgames.wordclimb",
  appName: "WordClimb",
  webDir: "out",
  server: {
    // During development, point to the local Next.js server.
    // Comment this out for production builds.
    // url: "http://192.168.1.x:3002",
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0c1a0e",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0c1a0e",
    },
  },
};

export default config;
