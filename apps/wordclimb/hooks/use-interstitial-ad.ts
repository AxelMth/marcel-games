/**
 * Thin wrapper — imports the shared hook from @marcel-games/lib
 * and passes WordClimb-specific ad unit IDs.
 */
import { useInterstitialAd } from "@marcel-games/lib"
import { INTERSTITIAL_AD_IDS } from "@/lib/ad-constants"

export function useWordclimbInterstitialAd() {
  return useInterstitialAd(INTERSTITIAL_AD_IDS)
}
