"use client"

import { useEffect, useState } from "react"
import {
  Loader2,
  ArrowLeft,
  CalendarCheck,
  Trophy,
  Globe,
  BookOpen,
  Calendar,
  Shuffle,
  Star,
} from "lucide-react"
import { useApp } from "@/lib/app-context"
import { t } from "@/lib/i18n"
import { getProfile, type ProfileResponse } from "@/lib/api"
import { LegalModal } from "@/components/wordclimb/legal-modal"
import { ScreenHeader } from "./screen-header"

type GameModeFilter = "all" | "WORLD" | "CONTINENTS" | "LEVEL_OF_THE_DAY"

function formatGameMode(locale: "en" | "fr", mode: string, continent: string): string {
  if (mode === "LEVEL_OF_THE_DAY") return locale === "fr" ? "Niveau du jour" : "Daily"
  if (mode === "WORLD") return locale === "fr" ? "Monde" : "World"
  if (mode === "CONTINENTS") {
    if (continent === "WORLD") return locale === "fr" ? "Monde" : "World"
    return continent
  }
  return mode
}

function filterHistory(
  entries: ProfileResponse["gameHistory"],
  filter: GameModeFilter
): ProfileResponse["gameHistory"] {
  if (filter === "all") return entries
  return entries.filter((e) => e.gameMode === filter)
}

export function StatsScreen() {
  const { locale, goHome, userId } = useApp()
  const [data, setData] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gameModeFilter, setGameModeFilter] =
    useState<GameModeFilter>("all")
  const [legalOpen, setLegalOpen] = useState(false)

  useEffect(() => {
    if (!userId) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    getProfile(userId)
      .then(setData)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load")
      )
      .finally(() => setLoading(false))
  }, [userId])

  const filteredHistory = data
    ? filterHistory(data.gameHistory, gameModeFilter)
    : []

  return (
    <div
      className="flex min-h-svh flex-col"
      style={{
        background:
          "linear-gradient(180deg, #55b3d1 0%, #69cbeb 40%, #c0e8f0 100%)",
        paddingTop: "max(1rem, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <ScreenHeader title="statsTitle" onBack={goHome} />

      <div className="flex flex-1 flex-col gap-6 px-4 py-6">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#0A3D62]" />
            <span className="text-sm font-medium text-[#0A3D62]/80">
              {t(locale, "profileLoading")}
            </span>
          </div>
        )}

        {error && (
          <p className="text-center text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        {!userId && !loading && (
          <p className="py-8 text-center text-sm text-[#0A3D62]/70">
            {t(locale, "profileNoUser")}
          </p>
        )}

        {!loading && !error && userId && data && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-2 rounded-xl bg-white/80 p-4 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0A3D62]/15">
                  <CalendarCheck className="h-6 w-6 text-[#0A3D62]" />
                </div>
                <p className="text-2xl font-bold text-[#0A3D62]">
                  {data.stats.dailyLevelsCompleted}
                </p>
                <p className="text-center text-xs font-medium text-[#0A3D62]/80">
                  {t(locale, "profileDaysCompleted")}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl bg-white/80 p-4 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0A3D62]/15">
                  <Trophy className="h-6 w-6 text-[#0A3D62]" />
                </div>
                <p className="text-2xl font-bold text-[#0A3D62]">
                  #{data.stats.lastLevelRank}
                </p>
                <p className="text-center text-xs font-medium text-[#0A3D62]/80">
                  {t(locale, "profileTodaysRank")}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl bg-white/80 p-4 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0A3D62]/15">
                  <Globe className="h-6 w-6 text-[#0A3D62]" />
                </div>
                <p className="text-2xl font-bold text-[#0A3D62]">
                  #{data.stats.globalRank}
                </p>
                <p className="text-center text-xs font-medium text-[#0A3D62]/80">
                  {t(locale, "profileGlobalRank")}
                </p>
              </div>
            </div>

            {/* Game mode filter */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#0A3D62]">
                {t(locale, "profileGameHistory")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {(["all", "WORLD", "CONTINENTS", "LEVEL_OF_THE_DAY"] as const).map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setGameModeFilter(value)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        gameModeFilter === value
                          ? "bg-[#0A3D62] text-white"
                          : "bg-white/80 text-[#0A3D62]"
                      }`}
                    >
                      {value === "all" && t(locale, "filterAll")}
                      {value === "WORLD" && (
                        <>
                          <BookOpen className="h-4 w-4 shrink-0" />
                          {locale === "fr" ? "Monde" : "World"}
                        </>
                      )}
                      {value === "LEVEL_OF_THE_DAY" && (
                        <>
                          <Calendar className="h-4 w-4 shrink-0" />
                          {locale === "fr" ? "Niveau du jour" : "Daily"}
                        </>
                      )}
                      {value === "CONTINENTS" && (
                        <>
                          <Shuffle className="h-4 w-4 shrink-0" />
                          {locale === "fr" ? "Continents" : "Continents"}
                        </>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <p className="rounded-xl bg-white/60 py-8 text-center text-sm text-[#0A3D62]/70">
                {t(locale, "profileNoHistory")}
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredHistory.map((entry, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-4 py-3 shadow-sm"
                  >
                    <span className="font-medium text-[#0A3D62]">
                      {formatGameMode(locale, entry.gameMode, entry.continent)} —{" "}
                      {t(locale, "level")} {entry.level}
                    </span>
                    {entry.stars != null && (
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= (entry.stars ?? 0)
                                ? "fill-[#f0a830] text-[#f0a830]"
                                : "fill-none text-[#b0d8e4]"
                            }`}
                            strokeWidth={1.5}
                          />
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

          </>
        )}

        <footer className="mt-auto pt-6 text-center">
          <button
            type="button"
            onClick={() => setLegalOpen(true)}
            className="text-xs font-medium text-[#0A3D62]/70 underline underline-offset-2"
          >
            {t(locale, "legalOpen")}
          </button>
        </footer>
      </div>

      {legalOpen && <LegalModal onClose={() => setLegalOpen(false)} />}
    </div>
  )
}
