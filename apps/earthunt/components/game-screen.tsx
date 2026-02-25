"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useGameStore } from "@/lib/game-store"
import { useLanguage } from "./language-provider"
import { useEarthuntRewardedAd } from "@/hooks/use-rewarded-ad"
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics"
import type { CountryLocale } from "@/lib/countries"

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function GameScreen() {
  const { lang, t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState("")

  const gameConfig = useGameStore((s) => s.gameConfig)
  const foundCountries = useGameStore((s) => s.foundCountries)
  const lastGuessResult = useGameStore((s) => s.lastGuessResult)
  const elapsedTime = useGameStore((s) => s.elapsedTime)
  const hintsUsed = useGameStore((s) => s.hintsUsed)
  const goHome = useGameStore((s) => s.goHome)
  const submitGuess = useGameStore((s) => s.submitGuess)
  const tick = useGameStore((s) => s.tick)
  const useHintFirstLetter = useGameStore((s) => s.useHintFirstLetter)
  const useHintShowOnMap = useGameStore((s) => s.useHintShowOnMap)
  const useHintFullName = useGameStore((s) => s.useHintFullName)
  const clearLastGuess = useGameStore((s) => s.clearLastGuess)

  const locale: CountryLocale = lang === "fr" ? "fr" : "en"

  // Timer
  useEffect(() => {
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [tick])

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const { showAd: showRewardAd } = useEarthuntRewardedAd({
    onReward: () => {
      useHintFullName(locale)
    },
  })

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!inputValue.trim()) return
      const result = submitGuess(inputValue.trim(), locale)
      setInputValue("")
      try {
        if (result.type === "correct") {
          Haptics.notification({ type: NotificationType.Success })
        } else {
          Haptics.impact({ style: ImpactStyle.Medium })
        }
      } catch {}
      setTimeout(clearLastGuess, 2000)
    },
    [inputValue, submitGuess, locale, clearLastGuess]
  )

  if (!gameConfig) return null

  const total = gameConfig.missingCountries.length
  const found = foundCountries.length

  return (
    <main className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <button onClick={goHome} className="text-sm text-muted-foreground">
          {"<"} {t("home.world")}
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            {found}/{total}
          </span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {formatTime(elapsedTime)}
          </span>
        </div>
      </header>

      {/* Map placeholder */}
      <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-card">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">World map renders here (SVG/Canvas)</p>
          <p className="mt-1 text-xs">
            {found}/{total} countries found
          </p>
        </div>
      </section>

      {/* Guess feedback */}
      {lastGuessResult && (
        <div
          className={`mx-4 mt-2 rounded-lg px-3 py-2 text-center text-sm font-medium ${
            lastGuessResult.type === "correct"
              ? "bg-green-600/20 text-green-400"
              : lastGuessResult.type === "already-found"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-destructive/20 text-destructive"
          }`}
        >
          {lastGuessResult.message}
        </div>
      )}

      {/* Hint buttons */}
      <div className="flex gap-2 px-4 py-2">
        <button
          onClick={() => useHintFirstLetter(locale)}
          className="flex-1 rounded-lg bg-card py-2 text-xs text-foreground"
        >
          1st letter
        </button>
        <button
          onClick={() => useHintShowOnMap()}
          className="flex-1 rounded-lg bg-card py-2 text-xs text-foreground"
        >
          Show on map
        </button>
        <button
          onClick={showRewardAd}
          className="flex-1 rounded-lg bg-primary/20 py-2 text-xs text-primary"
        >
          Full name (ad)
        </button>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 px-4 pb-4">
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a country name..."
          autoComplete="off"
          autoCorrect="off"
          className="flex-1 rounded-xl bg-card px-4 py-3 text-foreground placeholder-muted-foreground outline-none ring-1 ring-border focus:ring-primary"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground"
        >
          Go
        </button>
      </form>
    </main>
  )
}
