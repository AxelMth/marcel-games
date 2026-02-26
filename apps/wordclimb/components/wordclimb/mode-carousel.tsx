"use client"

import { useRef, type MouseEvent, type TouchEvent } from "react"
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
  const { locale, startGame } = useApp()
  const scrollRef = useRef<HTMLDivElement>(null)

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

  // Prevent swipe from triggering click
  const startX = useRef(0)
  const handlePointerDown = (e: MouseEvent | TouchEvent) => {
    const x = "touches" in e ? e.touches[0].clientX : e.clientX
    startX.current = x
  }

  const handleCardClick = (mode: GameMode, e: MouseEvent) => {
    const diff = Math.abs(e.clientX - startX.current)
    if (diff > 10) return // was a swipe
    startGame(mode)
  }

  return (
    <div
      ref={scrollRef}
      className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-[12.5vw] pb-4"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {modes.map(({ key, icon: Icon, color }) => (
        <button
          key={key}
          onPointerDown={handlePointerDown as any}
          onClick={(e) => handleCardClick(key, e)}
          className="snap-center shrink-0 flex flex-col items-center justify-center gap-3 rounded-[20px] bg-[rgba(255,255,255,0.92)] backdrop-blur-sm p-6 shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
          style={{ width: "75vw", maxWidth: "320px", minHeight: "180px" }}
        >
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 56,
              height: 56,
              backgroundColor: `${color}20`,
            }}
          >
            <Icon size={28} color={color} strokeWidth={2.2} />
          </div>
          <span
            className="text-lg font-bold"
            style={{ color }}
          >
            {t(locale, titleKey(key))}
          </span>
          <span className="text-sm text-[#50555C] text-center leading-relaxed">
            {t(locale, descKey(key))}
          </span>
        </button>
      ))}
    </div>
  )
}
