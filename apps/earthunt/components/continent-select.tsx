"use client"

import { useGameStore } from "@/lib/game-store"
import { useLanguage } from "./language-provider"
import type { Continent } from "@/lib/countries"

const CONTINENTS: { key: Continent; emoji: string; labelKey: string }[] = [
  { key: "EUROPE", emoji: "🇪🇺", labelKey: "Europe" },
  { key: "AFRICA", emoji: "🌍", labelKey: "Africa" },
  { key: "ASIA", emoji: "🌏", labelKey: "Asia" },
  { key: "AMERICAS", emoji: "🌎", labelKey: "Americas" },
  { key: "OCEANIA", emoji: "🏝️", labelKey: "Oceania" },
]

export function ContinentSelect() {
  const { t } = useLanguage()
  const goHome = useGameStore((s) => s.goHome)
  const startContinentGame = useGameStore((s) => s.startContinentGame)
  const progress = useGameStore((s) => s.progress)

  return (
    <main className="flex min-h-screen flex-col bg-background px-4 py-6">
      {/* Back button */}
      <button
        onClick={goHome}
        className="mb-6 self-start text-sm text-muted-foreground"
      >
        {"<"} {t("home.world")}
      </button>

      <h2 className="mb-4 text-2xl font-bold text-foreground">
        {t("home.continent")}
      </h2>

      <div className="flex flex-col gap-3">
        {CONTINENTS.map(({ key, emoji, labelKey }) => {
          const lvl = progress?.continentLevels?.[key] ?? 1
          return (
            <button
              key={key}
              onClick={() => startContinentGame(key)}
              className="flex items-center gap-4 rounded-2xl bg-card p-4 text-left transition-transform active:scale-[0.98]"
            >
              <span className="text-3xl">{emoji}</span>
              <div className="flex flex-col">
                <span className="font-bold text-foreground">{labelKey}</span>
                <span className="text-xs text-muted-foreground">
                  {t("continentSelect.level")} {lvl}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </main>
  )
}
