"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Capacitor } from "@capacitor/core"
import { AdMob } from "@capacitor-community/admob"

export interface AdIds {
  ios: string
  android: string
}

function getAdId(ids: AdIds): string {
  if (typeof window === "undefined") return ids.android
  const platform = Capacitor.getPlatform()
  if (platform === "ios") return ids.ios
  return ids.android
}

/**
 * How long a player waits for an ad before the reward is granted anyway.
 *
 * A hint is a deliberate action with a promised outcome, and a slow network
 * must not be able to swallow it. Losing the impression costs one ad; refusing
 * the hint costs the player's trust.
 */
const AD_LOAD_TIMEOUT_MS = 6000

export interface UseRewardedAdOptions {
  /**
   * When true, 50% chance to skip the ad and call successCallback immediately.
   * Defaults to false: skipping the ad forfeits the revenue of half the
   * rewarded impressions while granting the reward anyway.
   */
  isRandom?: boolean
}

/**
 * Shared rewarded ad hook.
 * Each app passes its own ad unit IDs from its ad-constants file.
 *
 * `isLoading` is part of the contract rather than a nicety: without it the UI
 * has no way to say anything while an ad loads, so the tap looks ignored until
 * the reward lands seconds later.
 */
export function useRewardedAd(
  adIds: AdIds,
  options: UseRewardedAdOptions = {}
) {
  const { isRandom = false } = options
  const preparedRef = useRef(false)
  const [isLoading, setIsLoading] = useState(false)
  const isNative =
    typeof window !== "undefined" && Capacitor.isNativePlatform()

  const prepare = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false
    if (preparedRef.current) return true
    try {
      const adId = getAdId(adIds)
      await AdMob.prepareRewardVideoAd({ adId })
      preparedRef.current = true
      return true
    } catch {
      return false
    }
  }, [isNative, adIds])

  useEffect(() => {
    if (isNative) prepare()
  }, [isNative, prepare])

  const showRewardedAd = useCallback(
    (successCallback: () => void) => {
      if (!isNative) {
        successCallback()
        return
      }
      if (isRandom && Math.random() > 0.5) {
        successCallback()
        return
      }

      let settled = false
      const grant = () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        setIsLoading(false)
        successCallback()
      }

      // The reward is never held hostage by a slow load.
      const timer = setTimeout(grant, AD_LOAD_TIMEOUT_MS)

      setIsLoading(true)
      prepare()
        .then((ready) => {
          if (settled) return undefined
          if (!ready) {
            grant()
            return undefined
          }
          return AdMob.showRewardVideoAd()
        })
        .then((result) => {
          preparedRef.current = false
          // Fetch the next one straight away. Without this the first hint of a
          // session used the ad loaded at mount and every later one waited on a
          // cold load — which is what made hints feel broken.
          void prepare()
          if (result !== undefined) grant()
        })
        .catch(() => {
          preparedRef.current = false
          void prepare()
          grant()
        })
    },
    [isNative, isRandom, prepare]
  )

  return { showRewardedAd, prepare, isLoading }
}
