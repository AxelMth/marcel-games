"use client"

import { useEffect, useState } from "react"

/**
 * Height in CSS pixels of the on-screen keyboard currently covering the page.
 *
 * The native keyboard is configured not to resize the web view
 * (`KeyboardResize.None`, see capacitor.config.ts), so the layout viewport keeps
 * its full height and only the *visual* viewport shrinks. Reading that
 * difference lets a single element lift above the keyboard, instead of the
 * whole page scrolling and taking the map with it.
 *
 * Returns 0 on browsers without `visualViewport` and whenever the keyboard is
 * closed, so callers can treat it as "no keyboard".
 */
export function useKeyboardOffset(): number {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const update = () => {
      // offsetTop covers the case where the visual viewport has been panned:
      // the part of the layout viewport hidden below the fold is what the
      // keyboard occupies.
      const hidden = window.innerHeight - viewport.height - viewport.offsetTop
      setOffset(Math.max(0, Math.round(hidden)))
    }

    update()
    viewport.addEventListener("resize", update)
    viewport.addEventListener("scroll", update)
    return () => {
      viewport.removeEventListener("resize", update)
      viewport.removeEventListener("scroll", update)
    }
  }, [])

  return offset
}
