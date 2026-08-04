"use client"

import { useEffect, useRef, useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { useGuidedTour } from "@/hooks/use-guided-tour"
import type { TourId } from "@/lib/tour-storage"

const DIM = "rgba(15, 43, 60, 0.72)"
const CUTOUT_RADIUS = 16
const BUBBLE_GAP = 14

interface GuidedTourProps {
  tour: TourId
  /** The screen's "ready for this" signal — see useGuidedTour. */
  enabled: boolean
}

/**
 * Dims the screen except for one element, and explains what that element does.
 *
 * The hole is punched with an SVG mask rather than four surrounding boxes: a
 * mask gives rounded corners for free and follows a moving target without the
 * seams four boxes show while the carousel is animating.
 */
export function GuidedTour({ tour, enabled }: GuidedTourProps) {
  const { t } = useLanguage()
  const { step, index, total, target, isLast, next, skip } = useGuidedTour(tour, enabled)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const nextButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener("resize", update)
    window.addEventListener("orientationchange", update)
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("orientationchange", update)
    }
  }, [])

  // Moving focus into the overlay is what makes it a dialog for a screen
  // reader, and it puts the keyboard where the player expects it.
  useEffect(() => {
    if (step && target) nextButtonRef.current?.focus()
  }, [step, target])

  if (!step || !target || viewport.height === 0) return null

  const below =
    step.placement === "below" ||
    (step.placement !== "above" && target.top + target.height / 2 < viewport.height / 2)

  const bubblePosition = below
    ? { top: target.top + target.height + BUBBLE_GAP }
    : { bottom: viewport.height - target.top + BUBBLE_GAP }

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={t(step.titleKey)}
      // Tapping anywhere advances, which is how most players will use it. The
      // buttons stay for anyone who looks for them.
      onClick={next}
    >
      <svg className="absolute inset-0 h-full w-full" aria-hidden focusable="false">
        <defs>
          <mask id="guided-tour-cutout">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={target.left}
              y={target.top}
              width={target.width}
              height={target.height}
              rx={CUTOUT_RADIUS}
              fill="black"
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill={DIM} mask="url(#guided-tour-cutout)" />
        <rect
          x={target.left}
          y={target.top}
          width={target.width}
          height={target.height}
          rx={CUTOUT_RADIUS}
          fill="none"
          stroke="white"
          strokeWidth={2}
          opacity={0.9}
        />
      </svg>

      <div
        className="absolute left-1/2 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl bg-white p-5 shadow-2xl"
        style={bubblePosition}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-base font-bold text-[#0f2b3c]">{t(step.titleKey)}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[#3a6b7e]">{t(step.descKey)}</p>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5" aria-hidden>
            {Array.from({ length: total }, (_, dot) => (
              <span
                key={dot}
                className={`h-1.5 rounded-full transition-all ${
                  dot === index ? "w-4 bg-[#1a8fb5]" : "w-1.5 bg-[#b0d8e4]"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isLast && (
              <button
                type="button"
                onClick={skip}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-[#3a6b7e] transition-colors active:bg-[#e0f4f8]"
              >
                {t("tour.skip")}
              </button>
            )}
            <button
              ref={nextButtonRef}
              type="button"
              onClick={next}
              className="rounded-xl bg-[#1a8fb5] px-4 py-2 text-sm font-bold text-white transition-colors active:bg-[#126a8a]"
            >
              {isLast ? t("tour.done") : t("tour.next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
