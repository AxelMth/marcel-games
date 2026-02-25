"use client"

import { useInterstitialAd } from "@marcel-games/lib"
import { ADMOB_INTERSTITIAL_AD_IDS } from "@/lib/ad-constants"

/**
 * Earthunt-specific interstitial ad hook.
 * Passes earthunt's ad unit IDs to the shared hook.
 */
export function useEarthuntInterstitialAd() {
  return useInterstitialAd(ADMOB_INTERSTITIAL_AD_IDS)
}
