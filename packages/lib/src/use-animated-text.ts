"use client"

import { useState, useCallback, useRef, useMemo } from "react"

function shuffleIndices(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i)
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices
}

/**
 * Animate each character's opacity one-by-one in random order.
 * Returns an array of opacities [0..1] for each character, a `start` function,
 * and a display array of characters (spaces as \u00A0 so they stay visible).
 *
 * Shared between earthunt (splash screen) and potentially wordclimb.
 */
export function useAnimatedText(
  text: string,
  msPerChar = 100
): [number[], () => void, string[]] {
  const displayChars = useMemo(
    () => text.split("").map((c) => (c === " " ? "\u00A0" : c)),
    [text]
  )
  const [opacities, setOpacities] = useState<number[]>(
    displayChars.map(() => 0)
  )
  const runningRef = useRef(false)

  const start = useCallback(() => {
    if (runningRef.current) return
    runningRef.current = true

    const order = shuffleIndices(displayChars.length)
    order.forEach((charIndex, step) => {
      setTimeout(() => {
        setOpacities((prev) => {
          const next = [...prev]
          next[charIndex] = 1
          return next
        })
      }, step * msPerChar)
    })
  }, [text, msPerChar, displayChars])

  return [opacities, start, displayChars]
}
