/**
 * AdMob app IDs (same as earthunt app.json).
 * Native config is in AndroidManifest.xml and Info.plist; this file is for reference and any runtime use.
 */
export const ADMOB_APP_IDS = {
  ios: "ca-app-pub-6271901101573718~5878435021",
  android: "ca-app-pub-6271901101573718~9313598215",
} as const

// Google's official sample ad units. Dev and simulator builds must use these:
// requesting live ads from test devices is an AdMob policy violation that can
// get the account limited or suspended.
// https://developers.google.com/admob/ios/test-ads
const IS_PROD = process.env.NODE_ENV === "production"

const TEST_INTERSTITIAL_AD_IDS = {
  ios: "ca-app-pub-3940256099942544/4411468910",
  android: "ca-app-pub-3940256099942544/1033173712",
} as const

const TEST_REWARDED_AD_IDS = {
  ios: "ca-app-pub-3940256099942544/1712485313",
  android: "ca-app-pub-3940256099942544/5224354917",
} as const

/** Same unit IDs as earthunt useAd.ts */
export const ADMOB_INTERSTITIAL_AD_IDS = IS_PROD
  ? ({
      ios: "ca-app-pub-6271901101573718/7012102030",
      android: "ca-app-pub-6271901101573718/7084333773",
    } as const)
  : TEST_INTERSTITIAL_AD_IDS

export const ADMOB_REWARDED_AD_IDS = IS_PROD
  ? ({
      ios: "ca-app-pub-6271901101573718/9626108346",
      android: "ca-app-pub-6271901101573718/5830961856",
    } as const)
  : TEST_REWARDED_AD_IDS

/** Show an interstitial ad every N levels when the user taps "Next Level" (world/continent only; daily has no interstitials). The first world level loaded from API skips one ad. */
export const NUMBER_OF_LEVELS_BETWEEN_ADS = 5
