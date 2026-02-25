"use client"

import { useEffect } from "react"

/**
 * Initializes AdMob when running in a native Capacitor context (iOS/Android).
 * Uses earthunt app IDs from capacitor native config (AndroidManifest.xml / Info.plist).
 */
export function AdMobInit() {
  useEffect(() => {
    if (typeof window === "undefined") return
    let cancelled = false
    const init = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core")
        const { AdMob } = await import("@capacitor-community/admob")
        if (!Capacitor.isNativePlatform() || cancelled) return
        await AdMob.initialize()
      } catch {
        // AdMob not available (e.g. web) or plugin not installed
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [])
  return null
}
