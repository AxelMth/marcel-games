"use client"

import { useEffect } from "react"
import { useGameStore } from "@/lib/game-store"
import { useLaunch } from "@/hooks/use-launch"
import { useLanguage } from "./language-provider"
import { useEarthuntInterstitialAd } from "@/hooks/use-interstitial-ad"
import { getProgress } from "@/lib/api"

export function HomeScreen() {
  const { t } = useLanguage()
  const userId = useGameStore((s) => s.userId)
  const goToStats = useGameStore((s) => s.goToStats)
  const goToContinentSelect = useGameStore((s) => s.goToContinentSelect)
  const startWorldGame = useGameStore((s) => s.startWorldGame)
  const startDailyGame = useGameStore((s) => s.startDailyGame)
  const progress = useGameStore((s) => s.progress)
  const setProgress = useGameStore((s) => s.setProgress)
  const setLoadingProgress = useGameStore((s) => s.setLoadingProgress)
  const isLoadingProgress = useGameStore((s) => s.isLoadingProgress)

  useLaunch()

  useEffect(() => {
    if (!userId) return
    setLoadingProgress(true)
    getProgress(userId)
      .then(setProgress)
      .catch(() => {})
      .finally(() => setLoadingProgress(false))
  }, [userId, setProgress, setLoadingProgress])

  const dailyDone = progress?.dailyCompleted ?? false

  return (
    <main className="flex h-screen flex-col items-center justify-between bg-background px-4 py-8">
      {/* Header */}
      <header className="flex w-full items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">EartHunt</h1>
        <button
          onClick={goToStats}
          className="rounded-full bg-card p-2 text-foreground"
          aria-label="Profile"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z" />
          </svg>
        </button>
      </header>

      {/* Mode cards */}
      <section className="flex w-full flex-col gap-4">
        {/* World */}
        <button
          onClick={startWorldGame}
          className="flex flex-col items-start gap-1 rounded-2xl bg-card p-5 text-left transition-transform active:scale-[0.98]"
        >
          <span className="text-2xl">🌍</span>
          <h2 className="text-lg font-bold text-foreground">{t("home.world")}</h2>
          <p className="text-sm text-muted-foreground">{t("home.worldSubtitle")}</p>
          {progress && (
            <span className="mt-1 text-xs text-primary">
              {t("continentSelect.level")} {progress.worldLevel}
            </span>
          )}
        </button>

        {/* Continent */}
        <button
          onClick={goToContinentSelect}
          className="flex flex-col items-start gap-1 rounded-2xl bg-card p-5 text-left transition-transform active:scale-[0.98]"
        >
          <span className="text-2xl">🗺️</span>
          <h2 className="text-lg font-bold text-foreground">{t("home.continent")}</h2>
          <p className="text-sm text-muted-foreground">{t("home.continentSubtitle")}</p>
        </button>

        {/* Daily */}
        <button
          onClick={dailyDone ? undefined : startDailyGame}
          disabled={dailyDone}
          className={`flex flex-col items-start gap-1 rounded-2xl p-5 text-left transition-transform active:scale-[0.98] ${
            dailyDone ? "bg-muted opacity-60" : "bg-card"
          }`}
        >
          <span className="text-2xl">📅</span>
          <h2 className="text-lg font-bold text-foreground">{t("home.daily")}</h2>
          <p className="text-sm text-muted-foreground">
            {dailyDone ? t("home.doneForToday") : t("home.dailySubtitle")}
          </p>
        </button>
      </section>

      {/* Footer hint */}
      <p className="text-xs text-muted-foreground">
        {isLoadingProgress ? t("profile.loading") : t("home.scrollToSelect")}
      </p>
    </main>
  )
}
