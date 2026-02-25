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

/**
 * Shared interstitial ad hook.
 * Each app passes its own ad unit IDs from its ad-constants file.
 */
export function useInterstitialAd(adIds: AdIds) {
  const preparedRef = useRef(false)
  const isNative =
    typeof window !== "undefined" && Capacitor.isNativePlatform()

  const prepare = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false
    if (preparedRef.current) return true
    try {
      const adId = getAdId(adIds)
      await AdMob.prepareInterstitial({ adId })
      preparedRef.current = true
      return true
    } catch {
      return false
    }
  }, [isNative, adIds])

  useEffect(() => {
    if (isNative) prepare()
  }, [isNative, prepare])

  const showInterstitial = useCallback(
    async (onComplete?: () => void) => {
      if (!isNative) {
        onComplete?.()
        return
      }
      const ready = await prepare()
      if (!ready) {
        onComplete?.()
        return
      }
      try {
        await AdMob.showInterstitial()
        preparedRef.current = false
        onComplete?.()
      } catch {
        preparedRef.current = false
        onComplete?.()
      }
    },
    [isNative, prepare]
  )

  return { showInterstitial, prepare }
}
