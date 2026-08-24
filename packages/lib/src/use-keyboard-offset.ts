"use client"

import { useEffect, useState } from "react"

/**
 * Height in CSS pixels of the on-screen keyboard currently covering the page.
 *
 * On a device the number comes from the Capacitor keyboard events, not from
 * `visualViewport`. With `KeyboardResize.None` (see capacitor.config.ts) the web
 * view keeps its full height and iOS never tells the page that an overlay is
 * sitting on top of it — `visualViewport.height` stays exactly as it was, so a
 * lift driven by it silently does nothing and the search bar ends up behind the
 * keyboard. The plugin reports the keyboard frame directly, in points on iOS and
 * density-independent pixels on Android, both of which are CSS pixels here.
 *
 * `visualViewport` is still the right source in a browser, where it does track
 * the keyboard, so the web path keeps using it.
 *
 * Returns 0 whenever no keyboard is up.
 */
export function useKeyboardOffset(): number {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    let cancelled = false
    let teardown: (() => void) | undefined

    const setup = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core")
        if (Capacitor.isNativePlatform()) {
          const { Keyboard } = await import("@capacitor/keyboard")
          const shown = await Keyboard.addListener("keyboardWillShow", (info) => {
            setOffset(Math.max(0, Math.round(info.keyboardHeight)))
          })
          const hidden = await Keyboard.addListener("keyboardWillHide", () => {
            setOffset(0)
          })
          const remove = () => {
            void shown.remove()
            void hidden.remove()
          }
          // The listeners are registered asynchronously, so an unmount can beat
          // them here; drop them straight away rather than leak.
          if (cancelled) {
            remove()
            return
          }
          teardown = remove
          return
        }
      } catch {
        // No Capacitor, or the plugin is missing: fall through to the web path.
      }

      const viewport = window.visualViewport
      if (!viewport || cancelled) return

      const update = () => {
        // offsetTop covers a panned visual viewport: what is hidden below the
        // fold is what the keyboard occupies.
        const hidden = window.innerHeight - viewport.height - viewport.offsetTop
        setOffset(Math.max(0, Math.round(hidden)))
      }

      update()
      viewport.addEventListener("resize", update)
      viewport.addEventListener("scroll", update)
      teardown = () => {
        viewport.removeEventListener("resize", update)
        viewport.removeEventListener("scroll", update)
      }
    }

    setup()

    return () => {
      cancelled = true
      teardown?.()
    }
  }, [])

  return offset
}
