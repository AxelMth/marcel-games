"use client"

import { useGameStore } from "@/lib/game-store"
import { useLanguage } from "./language-provider"
import { useEarthuntInterstitialAd } from "@/hooks/use-interstitial-ad"
import { postFinishLevel } from "@/lib/api"
import type { GameMode, Continent } from "@/lib/api"
import { useEffect } from "react"

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function getStars(attempts: number, total: number, hintsUsed: number): number {
  const ratio = total / Math.max(attempts, 1)
  if (hintsUsed === 0 && ratio >= 0.8) return 3
  if (ratio >= 0.5) return 2
  return 1
}

export function SuccessScreen() {
  const { t } = useLanguage()
  const gameConfig = useGameStore((s) => s.gameConfig)
  const foundCountries = useGameStore((s) => s.foundCountries)
  const attempts = useGameStore((s) => s.attempts)
  const elapsedTime = useGameStore((s) => s.elapsedTime)
  const hintsUsed = useGameStore((s) => s.hintsUsed)
  const userId = useGameStore((s) => s.userId)
  const nextLevel = useGameStore((s) => s.nextLevel)
  const goHome = useGameStore((s) => s.goHome)
  const setPendingNextLevel = useGameStore((s) => s.setPendingNextLevel)

  const { showAd } = useEarthuntInterstitialAd()

  const total = gameConfig?.missingCountries.length ?? 0
  const stars = getStars(attempts, total, hintsUsed)

  // Report to backend
  useEffect(() => {
    if (!userId || !gameConfig) return
    const mode = (gameConfig.mode === "world" ? "WORLD" : gameConfig.mode === "continent" ? "CONTINENTS" : "LEVEL_OF_THE_DAY") as GameMode
    const continent = (gameConfig.continent ?? "") as Continent | ""
    postFinishLevel({
      userId,
      attempts,
      timeSpent: elapsedTime,
      hintsUsed,
      gameMode: mode,
      continent,
      countryCodes: gameConfig.missingCountries.map((c) => c.code),
    })
      .then((res) => {
        if (res.nextCountryCodes?.length) {
          setPendingNextLevel(res.nextLevel, res.nextCountryCodes)
        }
      })
      .catch(() => {})
  }, [userId, gameConfig, attempts, elapsedTime, hintsUsed, setPendingNextLevel])

  function handleNext() {
    showAd()
    nextLevel()
  }

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-6 bg-background px-6">
      {/* Stars */}
      <div className="flex gap-2 text-4xl">
        {[1, 2, 3].map((s) => (
          <span key={s} className={s <= stars ? "text-accent" : "text-muted"}>
            ★
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="flex gap-6 text-center">
        <div>
          <p className="text-2xl font-bold text-foreground">{foundCountries.length}</p>
          <p className="text-xs text-muted-foreground">Found</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{attempts}</p>
          <p className="text-xs text-muted-foreground">Attempts</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{formatTime(elapsedTime)}</p>
          <p className="text-xs text-muted-foreground">Time</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{hintsUsed}</p>
          <p className="text-xs text-muted-foreground">Hints</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleNext}
          className="rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground"
        >
          Next Level
        </button>
        <button
          onClick={goHome}
          className="rounded-xl bg-card px-6 py-3 font-medium text-foreground"
        >
          Home
        </button>
      </div>
    </main>
  )
}
