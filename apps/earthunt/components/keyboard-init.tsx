"use client"

import { useEffect } from "react"

/**
 * Stops WKWebView from scrolling the page to reveal a focused input.
 *
 * `KeyboardResize.None` keeps the web view at full height, but iOS still nudges
 * its scroll view up so the caret stays visible — which slides the whole map
 * behind the fixed overlays. Disabling that scroll leaves the map still and
 * lets `useKeyboardOffset` raise only the search bar.
 *
 * Renders nothing; no-op on the web, where the API does not exist.
 */
export function KeyboardInit() {
  useEffect(() => {
    let cancelled = false

    const setup = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core")
        if (!Capacitor.isNativePlatform()) return
        // iOS-only API; on Android it rejects and the catch below swallows it.
        if (Capacitor.getPlatform() !== "ios") return
        const { Keyboard } = await import("@capacitor/keyboard")
        if (cancelled) return
        await Keyboard.setScroll({ isDisabled: true })
      } catch {
        // A keyboard that scrolls is a cosmetic regression, never a reason to
        // block the game from starting.
      }
    }

    setup()
    return () => {
      cancelled = true
    }
  }, [])

  return null
}
