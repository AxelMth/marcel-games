"use client"

import { useCallback, useMemo, useState } from "react"

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Returns opacities (0 or 1) per letter and a start function that runs
 * staggered opacity animations in random order.
 */
export function useAnimatedText(text: string, staggerDelayMs: number) {
  const letters = useMemo(() => text.split(""), [text])
  const [opacities, setOpacities] = useState<number[]>(() =>
    letters.map(() => 0)
  )

  const start = useCallback(() => {
    const indices = letters.map((_, i) => i)
    const order = shuffle(indices)

    order.forEach((letterIndex, i) => {
      const delay = i * staggerDelayMs
      const duration = 100 + Math.random() * 400
      window.setTimeout(() => {
        setOpacities((prev) => {
          const next = [...prev]
          next[letterIndex] = 1
          return next
        })
      }, delay + duration)
    })
  }, [letters.length, staggerDelayMs])

  return [opacities, start] as const
}
