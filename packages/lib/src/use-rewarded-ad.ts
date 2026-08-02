"use client"

import { useCallback, useEffect, useRef } from "react"
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
 */
export function useRewardedAd(
  adIds: AdIds,
  options: UseRewardedAdOptions = {}
) {
  const { isRandom = false } = options
  const preparedRef = useRef(false)
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
      prepare()
        .then((ready) => {
          if (!ready) {
            successCallback()
            return
          }
          return AdMob.showRewardVideoAd()
        })
        .then((result) => {
          preparedRef.current = false
          if (result !== undefined) successCallback()
        })
        .catch(() => {
          preparedRef.current = false
          successCallback()
        })
    },
    [isNative, isRandom, prepare]
  )

  return { showRewardedAd, prepare }
}
