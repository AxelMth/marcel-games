"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Capacitor } from "@capacitor/core"
import { AdMob } from "@capacitor-community/admob"
import { ADMOB_INTERSTITIAL_AD_IDS } from "@/lib/ad-constants"

const PRELOAD_TIMEOUT_MS = 4000

function getInterstitialAdId(): string {
  if (typeof window === "undefined") return ADMOB_INTERSTITIAL_AD_IDS.android
  const platform = Capacitor.getPlatform()
  if (platform === "ios") return ADMOB_INTERSTITIAL_AD_IDS.ios
  return ADMOB_INTERSTITIAL_AD_IDS.android
}

export function useInterstitialAd() {
  const [isReady, setIsReady] = useState(false)
  const preparedRef = useRef(false)

  const isNative = typeof window !== "undefined" && Capacitor.isNativePlatform()

  const prepare = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false
    if (preparedRef.current) return true
    try {
      const adId = getInterstitialAdId()
      await AdMob.prepareInterstitial({ adId })
      preparedRef.current = true
      setIsReady(true)
      return true
    } catch {
      return false
    }
  }, [isNative])

  const preload = useCallback((): Promise<boolean> => {
    if (!isNative) return Promise.resolve(false)
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), PRELOAD_TIMEOUT_MS)
      prepare()
        .then((ok) => {
          clearTimeout(timeout)
          resolve(ok)
        })
        .catch(() => {
          clearTimeout(timeout)
          resolve(false)
        })
    })
  }, [isNative, prepare])

  const show = useCallback(async (): Promise<void> => {
    if (!isNative) return
    try {
      await AdMob.showInterstitial()
      preparedRef.current = false
      setIsReady(false)
    } catch {
      // Ad not ready or failed to show
    }
  }, [isNative])

  return { isReady, prepare, preload, show }
}
