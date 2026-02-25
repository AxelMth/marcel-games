/**
 * Thin wrapper — imports the shared hook from @marcel-games/lib
 * and passes WordClimb-specific ad unit IDs.
 */
import { useRewardedAd } from "@marcel-games/lib"
import { REWARDED_AD_IDS } from "@/lib/ad-constants"

export function useWordclimbRewardedAd(opts?: { onReward?: () => void }) {
  return useRewardedAd({ adIds: REWARDED_AD_IDS, onReward: opts?.onReward })
}
