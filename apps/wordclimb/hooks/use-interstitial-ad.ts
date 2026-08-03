"use client"

import { useCallback, useState } from "react"
import {
  useInterstitialAd as useSharedInterstitialAd,
  type InterstitialAdIds,
} from "@marcel-games/lib"
import { ADMOB_INTERSTITIAL_AD_IDS } from "@/lib/ad-constants"

const PRELOAD_TIMEOUT_MS = 4000

/**
 * WordClimb-specific wrapper around shared interstitial ad hook.
 * Adds `isReady`, `preload` and `show` helpers on top of the shared implementation.
 */
export function useInterstitialAd() {
  const [isReady, setIsReady] = useState(false)
  const { prepare, showInterstitial } = useSharedInterstitialAd(
    ADMOB_INTERSTITIAL_AD_IDS as InterstitialAdIds
  )

  const preload = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), PRELOAD_TIMEOUT_MS)
      prepare()
        .then((ok) => {
          clearTimeout(timeout)
          setIsReady(ok)
          resolve(ok)
        })
        .catch(() => {
          clearTimeout(timeout)
          resolve(false)
        })
    })
  }, [prepare])

  const show = useCallback(async (): Promise<void> => {
    try {
      await showInterstitial()
      setIsReady(false)
    } catch {
      // Ad not ready or failed to show
    }
  }, [showInterstitial])

  return { isReady, prepare, preload, show }
}
