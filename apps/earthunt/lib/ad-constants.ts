/**
 * AdMob ad unit IDs for earthunt.
 * Native config is in AndroidManifest.xml and Info.plist.
 */
export const ADMOB_APP_IDS = {
  ios: "ca-app-pub-6271901101573718~5878435021",
  android: "ca-app-pub-6271901101573718~9313598215",
} as const

export const ADMOB_INTERSTITIAL_AD_IDS = {
  ios: "ca-app-pub-6271901101573718/7012102030",
  android: "ca-app-pub-6271901101573718/7084333773",
} as const

export const ADMOB_REWARDED_AD_IDS = {
  ios: "ca-app-pub-6271901101573718/9626108346",
  android: "ca-app-pub-6271901101573718/5830961856",
} as const

/** Show an interstitial ad every N levels (world/continent only). */
export const NUMBER_OF_LEVELS_BETWEEN_ADS = 5
