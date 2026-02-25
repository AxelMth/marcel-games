"use client"

import { useCallback, useEffect, useRef } from "react"
import { Capacitor } from "@capacitor/core"
import { AdMob } from "@capacitor-community/admob"
import { ADMOB_REWARDED_AD_IDS } from "@/lib/ad-constants"

function getRewardedAdId(): string {
  if (typeof window === "undefined") return ADMOB_REWARDED_AD_IDS.android
  const platform = Capacitor.getPlatform()
  if (platform === "ios") return ADMOB_REWARDED_AD_IDS.ios
  return ADMOB_REWARDED_AD_IDS.android
}

export interface UseRewardedAdOptions {
  /** When true, 50% chance to skip the ad and call successCallback immediately (earthunt behavior). */
  isRandom?: boolean
}

export function useRewardedAd(options: UseRewardedAdOptions = {}) {
  const { isRandom = true } = options
  const preparedRef = useRef(false)

  const isNative = typeof window !== "undefined" && Capacitor.isNativePlatform()

  const prepare = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false
    if (preparedRef.current) return true
    try {
      const adId = getRewardedAdId()
      await AdMob.prepareRewardVideoAd({ adId })
      preparedRef.current = true
      return true
    } catch {
      return false
    }
  }, [isNative])

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
