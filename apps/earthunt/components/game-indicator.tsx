"use client"

import { useEffect, useRef, useState } from "react"
import { useLanguage } from "@/components/language-provider"

interface GameIndicatorProps {
  remaining: number
  foundCount: number
  totalCount: number
  minutes: number
  seconds: number
}

export function GameIndicator({
  remaining,
  foundCount,
  totalCount,
  minutes,
  seconds,
}: GameIndicatorProps) {
  const previousRemaining = useRef(remaining)
  const [displayValue, setDisplayValue] = useState(remaining)
  const [animationPhase, setAnimationPhase] = useState<
    "idle" | "slide-out" | "slide-in" | "blink"
  >("idle")

  useEffect(() => {
    const wasDecrease =
      previousRemaining.current > remaining && remaining > 0
    const allFound = remaining === 0

    if (allFound) {
      setDisplayValue(0)
      setAnimationPhase("idle")
    } else if (wasDecrease) {
      setAnimationPhase("slide-out")
    } else {
      setDisplayValue(remaining)
    }

    previousRemaining.current = remaining
  }, [remaining])

  useEffect(() => {
    if (animationPhase === "slide-out") {
      const t = setTimeout(() => {
        setDisplayValue(remaining)
        setAnimationPhase("slide-in")
      }, 250)
      return () => clearTimeout(t)
    }
  }, [animationPhase, remaining])

  useEffect(() => {
    if (animationPhase === "slide-in") {
      const t = setTimeout(() => {
        setAnimationPhase("blink")
      }, 250)
      return () => clearTimeout(t)
    }
  }, [animationPhase])

  useEffect(() => {
    if (animationPhase === "blink") {
      const t = setTimeout(() => {
        setAnimationPhase("idle")
      }, 350 * 3 * 2)
      return () => clearTimeout(t)
    }
  }, [animationPhase])

  const showSlideOut = animationPhase === "slide-out"
  const showSlideIn = animationPhase === "slide-in"
  const showBlink = animationPhase === "blink"
  const allFound = remaining === 0
  const { t } = useLanguage()

  return (
    <div
      className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2"
      style={{
        top: "calc(max(0.75rem, env(safe-area-inset-top, 0px)) + 3.5rem)",
      }}
    >
      <div className="relative flex max-w-[min(90vw,320px)] items-center justify-center overflow-hidden rounded-full bg-white/85 px-5 py-2 shadow-lg backdrop-blur-sm">
        {allFound && (
          <div
            className="absolute inset-0 origin-left bg-[#2ec4a0] animate-game-indicator-complete-fill"
            aria-hidden
          />
        )}
        <div className="relative z-10 flex flex-col items-center gap-0.5 text-center">
          {allFound ? (
            <span className="text-sm font-bold text-white whitespace-normal">
              ✓ {t("game.allCountriesFound")}
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-5 overflow-hidden">
                <span
                  className={`block text-sm font-bold text-[#0f2b3c] ${
                    showSlideOut
                      ? "animate-game-indicator-slide-out"
                      : showSlideIn
                        ? "animate-game-indicator-slide-in"
                        : showBlink
                          ? "animate-game-indicator-blink"
                          : ""
                  }`}
                >
                  {displayValue} {displayValue === 1 ? t("game.missingOne") : t("game.missing")}
                </span>
              </div>
              <span className="mx-1 text-[#b0d8e4]">|</span>
              <span className="text-xs font-semibold text-[#3a6b7e]">
                {minutes}:{String(seconds).padStart(2, "0")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
