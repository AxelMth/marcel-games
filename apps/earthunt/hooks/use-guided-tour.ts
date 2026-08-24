"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { hasSeenTour, markTourSeen, resetTour, type TourId } from "@/lib/tour-storage"
import { TOURS, type TourStep } from "@/lib/tours"

const REPLAY_EVENT = "earthunt:tour-replay"

/** Forgets the tour and starts it again, wherever it is mounted. */
export function requestTourReplay(tour: TourId): void {
  resetTour(tour)
  window.dispatchEvent(new CustomEvent(REPLAY_EVENT, { detail: tour }))
}

export interface TourTarget {
  top: number
  left: number
  width: number
  height: number
}

export interface GuidedTour {
  step: TourStep | null
  index: number
  total: number
  target: TourTarget | null
  isLast: boolean
  next: () => void
  skip: () => void
}

function measure(selector: string, padding: number): TourTarget | null {
  const element = document.querySelector(`[data-tour="${selector}"]`)
  if (!element) return null

  const rect = element.getBoundingClientRect()
  // A collapsed rect means the element is mounted but not laid out yet (or is
  // hidden); treating it as missing lets the step be skipped instead of
  // spotlighting a point in the corner.
  if (rect.width === 0 || rect.height === 0) return null

  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  }
}

/**
 * Drives a guided tour: which step is showing, and where on screen its target
 * currently is.
 *
 * `enabled` is the caller's "the screen is ready for this" signal — the game
 * screen holds it back until the map has settled, so the tour never highlights
 * a spinner.
 */
export function useGuidedTour(tour: TourId, enabled: boolean): GuidedTour {
  const steps = TOURS[tour]
  const [index, setIndex] = useState<number | null>(null)
  const [target, setTarget] = useState<TourTarget | null>(null)
  const startedRef = useRef(false)

  const stop = useCallback(() => {
    setIndex(null)
    setTarget(null)
    markTourSeen(tour)
  }, [tour])

  // First run: start once the screen says it is ready, and only once.
  useEffect(() => {
    if (!enabled || startedRef.current || hasSeenTour(tour)) return
    startedRef.current = true
    setIndex(0)
  }, [enabled, tour])

  // Replay from the how-to-play sheet.
  useEffect(() => {
    const onReplay = (event: Event) => {
      if ((event as CustomEvent<TourId>).detail !== tour) return
      startedRef.current = true
      setIndex(0)
    }
    window.addEventListener(REPLAY_EVENT, onReplay)
    return () => window.removeEventListener(REPLAY_EVENT, onReplay)
  }, [tour])

  // Follow the target. A requestAnimationFrame loop rather than a
  // ResizeObserver: the home carousel scrolls the mode card under a smooth
  // animation, and an observer sees the resize but not the movement.
  useEffect(() => {
    if (index === null) return
    const step = steps[index]
    if (!step) return

    let frame = 0
    const follow = () => {
      setTarget(measure(step.target, step.padding ?? 8))
      frame = requestAnimationFrame(follow)
    }
    follow()
    return () => cancelAnimationFrame(frame)
  }, [index, steps])

  // A step whose target never appears would trap the player on a dimmed screen
  // with nothing highlighted, so give it a moment and then move on.
  useEffect(() => {
    if (index === null || target !== null) return
    const timer = setTimeout(() => {
      setIndex((current) => {
        if (current === null) return null
        const following = current + 1
        if (following >= steps.length) {
          markTourSeen(tour)
          return null
        }
        return following
      })
    }, 1200)
    return () => clearTimeout(timer)
  }, [index, target, steps.length, tour])

  const next = useCallback(() => {
    setIndex((current) => {
      if (current === null) return null
      const following = current + 1
      if (following >= steps.length) {
        markTourSeen(tour)
        return null
      }
      return following
    })
  }, [steps.length, tour])

  return {
    step: index === null ? null : (steps[index] ?? null),
    index: index ?? 0,
    total: steps.length,
    target,
    isLast: index !== null && index === steps.length - 1,
    next,
    skip: stop,
  }
}
