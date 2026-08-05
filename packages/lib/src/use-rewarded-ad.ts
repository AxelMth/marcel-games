"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { PluginListenerHandle } from "@capacitor/core"
import { Capacitor } from "@capacitor/core"
import { AdMob, RewardAdPluginEvents } from "@capacitor-community/admob"

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
 * How long the player waits for an ad to *load* before the reward is granted
 * anyway.
 *
 * This covers the load only, and is cancelled the moment the ad appears. An
 * earlier version timed the whole flow, so it fired six seconds into a
 * fifteen-second video: the reward landed and the sheet closed while the ad was
 * still playing, which looked exactly like "the ad shows but does nothing" —
 * and handed out a reward for an ad nobody had watched.
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
 * has no way to say anything while an ad loads, so the tap looks ignored.
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

      let done = false
      let loadTimer: ReturnType<typeof setTimeout> | undefined
      const listeners: PluginListenerHandle[] = []

      const finish = (granted: boolean) => {
        if (done) return
        done = true
        clearTimeout(loadTimer)
        for (const listener of listeners) void listener.remove()
        setIsLoading(false)
        if (granted) successCallback()
      }

      setIsLoading(true)
      loadTimer = setTimeout(() => finish(true), AD_LOAD_TIMEOUT_MS)

      const run = async () => {
        // showRewardVideoAd()'s promise only settles when the reward is earned
        // — dismissing the ad early leaves it pending for ever — so the events
        // are what actually drive this, and the promise is the backstop.
        listeners.push(
          await AdMob.addListener(RewardAdPluginEvents.Showed, () => {
            // The ad is on screen: the player is watching, not waiting.
            clearTimeout(loadTimer)
            setIsLoading(false)
          })
        )
        listeners.push(
          await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => finish(true))
        )
        listeners.push(
          // Closed before the reward: no hint, but the UI has to come back.
          await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => finish(false))
        )
        listeners.push(
          await AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => finish(true))
        )

        const ready = await prepare()
        if (done) return
        if (!ready) {
          finish(true)
          return
        }

        const reward = await AdMob.showRewardVideoAd()
        preparedRef.current = false
        // Fetch the next one straight away, or every later hint in the session
        // waits on a cold load.
        void prepare()
        if (reward !== undefined) finish(true)
      }

      run().catch(() => {
        preparedRef.current = false
        void prepare()
        finish(true)
      })
    },
    [isNative, isRandom, prepare]
  )

  return { showRewardedAd, prepare, isLoading }
}
