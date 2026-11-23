import { rewardedUnitId, useRewardedAd } from "@marcel-games/expo-ui"
import { earnCoinsForAd } from "./wallet-store"

// WordClimb's own AdMob units: reusing EarthHunt's would break AdMob policy and mix the two apps' revenue.
const REWARDED_UNIT = rewardedUnitId({
  ios: "ca-app-pub-6271901101573718/5313054703",
  android: "ca-app-pub-6271901101573718/1913452475",
})

/** A rewarded ad that tops up the wallet once watched to the end. */
export function useCoinsAd() {
  const ad = useRewardedAd(REWARDED_UNIT)
  const watch = async () => {
    if (await ad.show()) earnCoinsForAd()
  }
  return { ready: ad.ready, watch }
}
