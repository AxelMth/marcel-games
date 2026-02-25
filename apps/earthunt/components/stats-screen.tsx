"use client"

import { useEffect, useState } from "react"
import {
  Loader2,
  CalendarCheck,
  Trophy,
  Globe,
  Globe2,
  Map,
  Calendar,
  Star,
  Medal,
} from "lucide-react"
import { useGameStore } from "@/lib/game-store"
import { useLanguage } from "@/components/language-provider"
import { ScreenHeader } from "@/components/screen-header"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getProfile, type ProfileResponse, type GameHistoryEntry } from "@/lib/api"

type GameModeFilter = "WORLD" | "CONTINENTS" | "LEVEL_OF_THE_DAY"

function formatGameMode(mode: string, continent: string): string {
  if (mode === "LEVEL_OF_THE_DAY") return "Daily"
  if (mode === "WORLD") return "World"
  if (mode === "CONTINENTS") return continent === "WORLD" ? "World" : continent
  return mode
}

function filterHistory(
  entries: GameHistoryEntry[],
  filter: GameModeFilter
): GameHistoryEntry[] {
  return entries.filter((e) => e.gameMode === filter)
}

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <Medal className="h-5 w-5 text-amber-500" aria-label="1st place" />
    )
  }
  if (rank === 2) {
    return (
      <Medal className="h-5 w-5 text-slate-400" aria-label="2nd place" />
    )
  }
  if (rank === 3) {
    return (
      <Medal className="h-5 w-5 text-amber-700" aria-label="3rd place" />
    )
  }
  return (
    <span className="text-sm font-medium text-[#0f2b3c]/80">#{rank}</span>
  )
}

export function StatsScreen() {
  const { t } = useLanguage()
  const { goHome, userId } = useGameStore()
  const [data, setData] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gameModeFilter, setGameModeFilter] =
    useState<GameModeFilter>("WORLD")

  useEffect(() => {
    if (!userId) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    getProfile(userId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false))
  }, [userId])

  const filteredHistory = data
    ? filterHistory(data.gameHistory, gameModeFilter)
    : []

  return (
    <main className="flex min-h-svh flex-col px-0 py-6 pb-20">
      <ScreenHeader
        title="profile.stats"
        showBackButton
        onBack={goHome}
        showCog={false}
      />

      <div className="flex flex-1 flex-col gap-6 px-5 pt-2">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 my-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#0f2b3c]" />
            <span className="text-sm font-medium text-[#0f2b3c]/80">
              {t("profile.loading")}
            </span>
          </div>
        )}

        {error && (
          <p className="text-center text-sm font-medium text-red-600">{error}</p>
        )}

        {!userId && !loading && (
          <p className="py-8 text-center text-sm text-[#0f2b3c]/70">
            {t("profile.noUser")}
          </p>
        )}

        {!loading && !error && userId && data && (
          <>
            {/* Main stats with icons */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-2 rounded-xl bg-white/80 p-4 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0f2b3c]/15">
                  <CalendarCheck className="h-6 w-6 text-[#0f2b3c]" />
                </div>
                <p className="text-2xl font-bold text-[#0f2b3c]">
                  {data.stats.dailyLevelsCompleted}
                </p>
                <p className="text-center text-xs font-medium text-[#0f2b3c]/80">
                  {t("profile.daysCompleted")}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl bg-white/80 p-4 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0f2b3c]/15">
                  <Trophy className="h-6 w-6 text-[#0f2b3c]" />
                </div>
                <p className="text-2xl font-bold text-[#0f2b3c]">
                  #{data.stats.lastLevelRank}
                </p>
                <p className="text-center text-xs font-medium text-[#0f2b3c]/80">
                  {t("profile.todaysRank")}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl bg-white/80 p-4 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0f2b3c]/15">
                  <Globe className="h-6 w-6 text-[#0f2b3c]" />
                </div>
                <p className="text-2xl font-bold text-[#0f2b3c]">
                  #{data.stats.globalRank}
                </p>
                <p className="text-center text-xs font-medium text-[#0f2b3c]/80">
                  {t("profile.globalRank")}
                </p>
              </div>
            </div>

            {/* Game mode toggle */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#0f2b3c]">
                {t("stats.gameMode")}
              </h3>
              <ToggleGroup
                type="single"
                value={gameModeFilter}
                onValueChange={(v) =>
                  v && setGameModeFilter(v as GameModeFilter)
                }
                variant="outline"
                className="w-full justify-stretch"
              >
                <ToggleGroupItem
                  value="WORLD"
                  className="flex-1 gap-1.5 px-2 py-2 text-xs"
                  aria-label={t("home.world")}
                >
                  <Globe2 className="h-4 w-4 shrink-0" />
                  {t("home.world")}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="CONTINENTS"
                  className="flex-1 gap-1.5 px-2 py-2 text-xs"
                  aria-label={t("home.continent")}
                >
                  <Map className="h-4 w-4 shrink-0" />
                  {t("home.continent")}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="LEVEL_OF_THE_DAY"
                  className="flex-1 gap-1.5 px-2 py-2 text-xs"
                  aria-label={t("home.daily")}
                >
                  <Calendar className="h-4 w-4 shrink-0" />
                  {t("home.daily")}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Game history */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#0f2b3c]">
                {t("profile.gameHistory")}
              </h3>
              {filteredHistory.length === 0 ? (
                <p className="rounded-xl bg-white/60 py-8 text-center text-sm text-[#0f2b3c]/70">
                  {t("profile.noHistory")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {filteredHistory.map((entry, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-4 py-3 shadow-sm"
                    >
                      <span className="font-medium text-[#0f2b3c]">
                        {formatGameMode(entry.gameMode, entry.continent)} Lvl{" "}
                        {entry.level}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= entry.stars
                                  ? "fill-[#f0a830] text-[#f0a830]"
                                  : "fill-none text-[#b0d8e4]"
                              }`}
                              strokeWidth={1.5}
                            />
                          ))}
                        </div>
                        <RankDisplay rank={entry.rank} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
