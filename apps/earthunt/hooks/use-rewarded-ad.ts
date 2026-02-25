"use client"

import { useRewardedAd, type UseRewardedAdOptions } from "@marcel-games/lib"
import { ADMOB_REWARDED_AD_IDS } from "@/lib/ad-constants"

/**
 * Earthunt-specific rewarded ad hook.
 * Passes earthunt's ad unit IDs to the shared hook.
 */
export function useEarthuntRewardedAd(options?: UseRewardedAdOptions) {
  return useRewardedAd(ADMOB_REWARDED_AD_IDS, options)
}
