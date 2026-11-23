import * as Device from "expo-device"
import { useCallback, useEffect, useRef, useState } from "react"
import { Platform } from "react-native"
import mobileAds, {
  AdEventType,
  AdsConsent,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads"

const RETRY_MS = 30_000

export interface AdUnitIds {
  ios: string
  android: string
}

let started: Promise<void> | null = null

/**
 * Asks for consent where the law wants it (the UMP form set up in AdMob), then starts the SDK.
 * Ads are requested even when consent fails: they are non-personalised, which needs none.
 */
export function startAds(): Promise<void> {
  started ??= AdsConsent.gatherConsent()
    .catch((error: unknown) => console.error("Ad consent could not be gathered", error))
    .then(() => mobileAds().initialize())
    .then(() => undefined)
  return started
}

/**
 * The app's own unit on a real device in a release build; Google's test unit anywhere else.
 * Requesting live ads from a simulator or a dev build breaks AdMob policy and can get the account limited.
 */
export function rewardedUnitId(units: AdUnitIds): string {
  if (__DEV__ || !Device.isDevice) return TestIds.REWARDED
  return Platform.OS === "ios" ? units.ios : units.android
}

export interface RewardedAdHandle {
  /** An ad is loaded and can be shown now. */
  ready: boolean
  /** Shows the ad; true once the player has watched it to the end. */
  show: () => Promise<boolean>
}

/** One rewarded ad kept loaded in the background, reloaded after each showing. */
export function useRewardedAd(unitId: string): RewardedAdHandle {
  const [ready, setReady] = useState(false)
  const adRef = useRef<RewardedAd | null>(null)
  const settle = useRef<((earned: boolean) => void) | null>(null)
  const earned = useRef(false)

  useEffect(() => {
    // Without ATT the device has no advertising ID to share, so ads stay non-personalised and nothing tracks the player.
    const ad = RewardedAd.createForAdRequest(unitId, { requestNonPersonalizedAdsOnly: true })
    adRef.current = ad
    let retry: ReturnType<typeof setTimeout> | null = null
    let alive = true
    const load = () => {
      if (alive) ad.load()
    }

    const unsubscribers = [
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => setReady(true)),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned.current = true
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        setReady(false)
        settle.current?.(earned.current)
        settle.current = null
        load()
      }),
      ad.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error("Rewarded ad failed", error)
        setReady(false)
        settle.current?.(false)
        settle.current = null
        retry = setTimeout(load, RETRY_MS)
      }),
    ]

    void startAds().then(load)

    return () => {
      alive = false
      if (retry) clearTimeout(retry)
      for (const unsubscribe of unsubscribers) unsubscribe()
      adRef.current = null
    }
  }, [unitId])

  const show = useCallback(async () => {
    const ad = adRef.current
    if (!ad || !ad.loaded) return false
    earned.current = false
    const result = new Promise<boolean>((resolve) => {
      settle.current = resolve
    })
    try {
      await ad.show()
    } catch (error) {
      console.error("Rewarded ad could not be shown", error)
      settle.current = null
      return false
    }
    return result
  }, [])

  return { ready, show }
}
