"use client"

import { useRewardedAd as useSharedRewardedAd, type UseRewardedAdOptions } from "@marcel-games/lib"
import { ADMOB_REWARDED_AD_IDS } from "@/lib/ad-constants"

/**
 * Earthunt-specific wrapper around shared rewarded ad hook.
 * Keeps the same API for the app while delegating core logic to @marcel-games/lib.
 */
export function useRewardedAd(options: UseRewardedAdOptions = {}) {
  return useSharedRewardedAd(ADMOB_REWARDED_AD_IDS, options)
}
