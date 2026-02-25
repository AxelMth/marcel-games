"use client"

import { useState, useCallback, useRef } from "react"

/**
 * Animate each character's opacity one-by-one.
 * Returns an array of opacities [0..1] for each character, and a `start` function.
 *
 * Shared between earthunt (splash screen) and potentially wordclimb.
 */
export function useAnimatedText(
  text: string,
  msPerChar = 100
): [number[], () => void] {
  const [opacities, setOpacities] = useState<number[]>(
    text.split("").map(() => 0)
  )
  const runningRef = useRef(false)

  const start = useCallback(() => {
    if (runningRef.current) return
    runningRef.current = true

    text.split("").forEach((_, i) => {
      setTimeout(() => {
        setOpacities((prev) => {
          const next = [...prev]
          next[i] = 1
          return next
        })
      }, i * msPerChar)
    })
  }, [text, msPerChar])

  return [opacities, start]
}
