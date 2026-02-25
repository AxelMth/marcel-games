/**
 * AdMob ad unit IDs for WordClimb.
 * Uses test IDs in development.
 */
export const IS_DEV = process.env.NODE_ENV === "development"

export const INTERSTITIAL_AD_IDS = {
  android: IS_DEV
    ? "ca-app-pub-3940256099942544/1033173712"
    : (process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ANDROID ?? ""),
  ios: IS_DEV
    ? "ca-app-pub-3940256099942544/4411468910"
    : (process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_IOS ?? ""),
}

export const REWARDED_AD_IDS = {
  android: IS_DEV
    ? "ca-app-pub-3940256099942544/5224354917"
    : (process.env.NEXT_PUBLIC_ADMOB_REWARDED_ANDROID ?? ""),
  ios: IS_DEV
    ? "ca-app-pub-3940256099942544/1712485313"
    : (process.env.NEXT_PUBLIC_ADMOB_REWARDED_IOS ?? ""),
}
