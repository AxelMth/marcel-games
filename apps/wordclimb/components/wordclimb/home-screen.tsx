"use client"

import { useAppContext } from "@/lib/app-context"
import { useGameStore } from "@/lib/game-store"
import { t } from "@/lib/i18n"

export function HomeScreen() {
  const { language, setScreen } = useAppContext()
  const init = useGameStore((s) => s.init)

  function handlePlay() {
    init(0)
    setScreen("game")
  }

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-8 bg-background px-6">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-5xl font-bold text-primary">WordClimb</h1>
        <p className="text-center text-muted-foreground">
          {t("homeSubtitle", language)}
        </p>
      </div>

      <button
        onClick={handlePlay}
        className="rounded-xl bg-primary px-10 py-4 text-lg font-bold text-primary-foreground transition-transform active:scale-95"
      >
        {t("play", language)}
      </button>
    </main>
  )
}
