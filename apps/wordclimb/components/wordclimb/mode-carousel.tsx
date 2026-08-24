"use client"

import { useRef, useState, useCallback, type MouseEvent, type TouchEvent } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { BookOpen, Calendar, Shuffle } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { t } from "@/lib/i18n"
import type { GameMode } from "@/lib/game-store"

const modes: { key: GameMode; icon: typeof BookOpen; color: string }[] = [
  { key: "classic", icon: BookOpen, color: "#1D70A2" },
  { key: "daily", icon: Calendar, color: "#2E8B57" },
  { key: "random", icon: Shuffle, color: "#D4782F" },
]

export function ModeCarousel() {
  const { locale, startGame, progress, isStartingGame } = useApp()
  const scrollRef = useRef<HTMLDivElement>(null)
  const firstCardRef = useRef<HTMLButtonElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const getScrollStep = useCallback(() => {
    const card = firstCardRef.current
    if (!card) return 0
    const cardWidth = card.offsetWidth
    const gap = 16
    return cardWidth + gap
  }, [])

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = scrollRef.current
      if (!el) return
      const step = getScrollStep()
      if (!step) return
      el.scrollTo({ left: index * step, behavior: "smooth" })
      setSelectedIndex(index)
    },
    [getScrollStep]
  )

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    const step = getScrollStep()
    if (!el || !step) return
    const index = Math.round(el.scrollLeft / step)
    setSelectedIndex(Math.max(0, Math.min(modes.length - 1, index)))
  }, [getScrollStep])

  const titleKey = (key: GameMode) => {
    switch (key) {
      case "classic":
        return "classic" as const
      case "daily":
        return "dailyChallenge" as const
      case "random":
        return "random" as const
    }
  }

  const descKey = (key: GameMode) => {
    switch (key) {
      case "classic":
        return "classicDesc" as const
      case "daily":
        return "dailyChallengeDesc" as const
      case "random":
        return "randomDesc" as const
    }
  }

  const startX = useRef(0)
  const handlePointerDown = (e: MouseEvent | TouchEvent) => {
    const x = "touches" in e ? e.touches[0].clientX : e.clientX
    startX.current = x
  }

  const handleCardClick = (mode: GameMode, e: MouseEvent) => {
    const diff = Math.abs(e.clientX - startX.current)
    if (diff > 10) return
    const dailyDone = progress?.dailyCompleted ?? false
    if (mode === "daily" && dailyDone) return
    // Fetching the level is a round trip now; a second tap while it is in
    // flight would start two games.
    if (isStartingGame) return
    void startGame(mode)
  }

  const classicLevel = progress?.worldLevel ?? 1
  const dailyDone = progress?.dailyCompleted ?? false

  return (
    <div className="flex w-full items-center justify-center gap-2 px-4">
      <button
        type="button"
        onClick={() => scrollToIndex(selectedIndex - 1)}
        disabled={selectedIndex === 0}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#0A3D62] shadow-md transition-opacity disabled:opacity-30"
        aria-label="Previous mode"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex min-w-0 max-w-md flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-visible scrollbar-none"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {modes.map(({ key, icon: Icon, color }, i) => {
          const isDailyDisabled = key === "daily" && dailyDone
          return (
            <button
              key={key}
              ref={i === 0 ? firstCardRef : undefined}
              onPointerDown={handlePointerDown as (e: MouseEvent) => void}
              onClick={(e) => handleCardClick(key, e)}
              disabled={isDailyDisabled || isStartingGame}
              className="flex w-full shrink-0 snap-center px-2 py-1 transition-transform active:scale-[0.97] disabled:opacity-60"
            >
              {/* No white panel: the card sits straight on the gradient, the
                  way earthunt's mode card does. Text colours move off the grey
                  greys, which only read against white. */}
              <div
                className="flex w-full flex-col items-center justify-center gap-3 p-6"
                style={{ minHeight: "180px" }}
              >
                <div
                  className="flex items-center justify-center rounded-full bg-white/40 backdrop-blur-sm"
                  style={{ width: 56, height: 56 }}
                >
                  <Icon size={28} color={color} strokeWidth={2.2} />
                </div>
                <span className="text-center text-lg font-bold text-[#0A3D62]">
                  {t(locale, titleKey(key))}
                </span>
                <span className="min-h-[2.5rem] w-full text-center text-sm leading-relaxed text-[#0A3D62]/80">
                  {key === "daily" && dailyDone
                    ? t(locale, "doneForToday")
                    : t(locale, descKey(key))}
                </span>
                {key === "classic" && (
                  <span className="w-full text-center text-xs font-medium text-[#0A3D62]/60">
                    {t(locale, "level")} {classicLevel}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => scrollToIndex(selectedIndex + 1)}
        disabled={selectedIndex === modes.length - 1}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#0A3D62] shadow-md transition-opacity disabled:opacity-30"
        aria-label="Next mode"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  )
}
