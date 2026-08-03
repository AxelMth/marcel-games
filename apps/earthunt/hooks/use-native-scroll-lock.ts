"use client"

import { useEffect } from "react"

/**
 * Stops WKWebView from scrolling the page to reveal a focused input, for as
 * long as the calling component is mounted.
 *
 * `KeyboardResize.None` keeps the web view at full height, but iOS still nudges
 * its scroll view up so the caret stays visible, which slides the whole map
 * behind the fixed overlays. Locking the scroll leaves the map still and lets
 * `useKeyboardOffset` raise only the search bar.
 *
 * Scoped deliberately, not called once at app start: the lock is a property of
 * the WKWebView, so enabling it globally would take document scrolling away
 * from every other screen — the stats history runs to fifty rows and would
 * become unreachable past the fold. It is released on unmount.
 *
 * No-op on the web, where the API does not exist.
 */
export function useNativeScrollLock() {
  useEffect(() => {
    let released = false

    const setScroll = async (isDisabled: boolean) => {
      try {
        const { Capacitor } = await import("@capacitor/core")
        // setScroll is iOS-only; on Android it rejects and the catch swallows it.
        if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return
        const { Keyboard } = await import("@capacitor/keyboard")
        await Keyboard.setScroll({ isDisabled })
      } catch {
        // A keyboard that scrolls the page is a cosmetic regression, never a
        // reason to block the game.
      }
    }

    void setScroll(true).then(() => {
      // An unmount can beat the async enable; make sure we do not leave the
      // whole web view locked behind us.
      if (released) void setScroll(false)
    })

    return () => {
      released = true
      void setScroll(false)
    }
  }, [])
}
