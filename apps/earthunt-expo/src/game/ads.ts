import { rewardedUnitId, useRewardedAd } from "@marcel-games/expo-ui"
import { earnCoinsForAd } from "./wallet-store"

// EarthHunt's own AdMob units: reusing WordClimb's would break AdMob policy and mix the two apps' revenue.
const REWARDED_UNIT = rewardedUnitId({
  ios: "ca-app-pub-6271901101573718/9626108346",
  android: "ca-app-pub-6271901101573718/5830961856",
})

/** A rewarded ad that tops up the wallet once watched to the end. */
export function useCoinsAd() {
  const ad = useRewardedAd(REWARDED_UNIT)
  const watch = async () => {
    if (await ad.show()) earnCoinsForAd()
  }
  return { ready: ad.ready, watch }
}
