"use client"

import { useEffect } from "react"

/**
 * Device identifiers that should be served test ads, comma-separated.
 *
 * Needed because a real device is the one place you cannot check the ad
 * pipeline: the iOS Simulator is registered as a test device automatically, so
 * it shows a test ad even when asked for a production unit — a green run there
 * says nothing about whether a real phone will get an ad. On hardware the same
 * unit asks for a live ad, and a freshly created unit routinely answers "no
 * fill" for hours, which looks exactly like a broken integration.
 *
 * Listing the device here makes it ask for test ads instead, which separates
 * "the wiring is wrong" from "there is no inventory yet" in one run. It is also
 * the only sanctioned way to exercise ads on your own hardware: requesting live
 * ads from a device you control is an AdMob policy violation.
 *
 * The SDK prints the identifier to the device log on the first ad request:
 *   <Google> To get test ads on this device, set: ... @"THE-ID"
 *
 * Unset in a normal build, which leaves initialization exactly as it was.
 */
export interface AdMobInitProps {
  /** See the note above. Supplied by the app, which owns its own env. */
  testDeviceIds?: string[]
}

/**
 * Initializes AdMob when running in a native Capacitor context (iOS/Android).
 * Shared between earthunt and wordclimb — app IDs are configured in
 * native project files (AndroidManifest.xml / Info.plist), not here.
 */
export function AdMobInit({ testDeviceIds = [] }: AdMobInitProps = {}) {
  useEffect(() => {
    if (typeof window === "undefined") return
    let cancelled = false
    const init = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core")
        const { AdMob } = await import("@capacitor-community/admob")
        if (!Capacitor.isNativePlatform() || cancelled) return

        // testingDevices is ignored unless initializeForTesting is set, so the
        // two travel together — and both stay off when no device is listed.
        await AdMob.initialize(
          testDeviceIds.length > 0
            ? { testingDevices: testDeviceIds, initializeForTesting: true }
            : undefined
        )
      } catch {
        // AdMob not available (e.g. web) or plugin not installed
      }
    }
    init()
    return () => {
      cancelled = true
    }
    // Keyed on the joined value, not the array: the default `[]` is a fresh
    // object on every render, which would re-run initialization in a loop for
    // any caller that omits the prop.
  }, [testDeviceIds.join(",")])
  return null
}
