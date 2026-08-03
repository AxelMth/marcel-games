// Shared storage layer (Capacitor Preferences / localStorage / in-memory)
export { storage } from "./storage"

// Shared hooks
export { useDeviceUUID, type DurableIdStore } from "./use-device-uuid"
export { getLaunchDeviceInfo, type LaunchDeviceInfo } from "./get-launch-device-info"
export { useAnimatedText } from "./use-animated-text"
export { useInterstitialAd, type AdIds as InterstitialAdIds } from "./use-interstitial-ad"
export { useRewardedAd, type UseRewardedAdOptions, type AdIds as RewardedAdIds } from "./use-rewarded-ad"

// Shared utilities
export { getLanguage, type Language } from "./language"

// Shared components
export { AdMobInit } from "./admob-init"
