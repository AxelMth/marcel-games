"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Loader2,
  Star,
  Medal,
} from "lucide-react"
import { useGameStore } from "@/lib/game-store"
import { useLanguage } from "@/components/language-provider"
import { ScreenHeader } from "@/components/screen-header"
import { ToggleGroup, ToggleGroupItem } from "@marcel-games/ui"
import { getProfile, type ProfileResponse, type GameHistoryEntry } from "@/lib/api"

type GameModeFilter = "WORLD" | "CONTINENTS" | "LEVEL_OF_THE_DAY"

const MODE_IMAGES: Record<GameModeFilter, { src: string; alt: string }> = {
  WORLD: { src: "/images/earth-logo.png", alt: "World" },
  CONTINENTS: { src: "/images/continent.png", alt: "Continent" },
  LEVEL_OF_THE_DAY: { src: "/images/daily.png", alt: "Daily" },
}

function modeImageForEntry(entry: GameHistoryEntry): { src: string; alt: string } {
  if (entry.gameMode === "LEVEL_OF_THE_DAY") return MODE_IMAGES.LEVEL_OF_THE_DAY
  if (entry.gameMode === "WORLD") return MODE_IMAGES.WORLD
  return MODE_IMAGES.CONTINENTS
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

  const modeLabel =
    gameModeFilter === "WORLD"
      ? t("home.world")
      : gameModeFilter === "CONTINENTS"
        ? t("home.continent")
        : t("home.daily")

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
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12">
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
            {/* Global rank hero at top */}
            <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#0f2b3c] px-6 py-5 text-white shadow-md">
              <p className="text-sm font-medium text-white/80">
                {t("profile.globalRank")}
              </p>
              <p className="text-3xl font-bold tracking-tight">
                #{data.stats.globalRank}
              </p>
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
                className="w-full justify-stretch bg-white"
              >
                <ToggleGroupItem
                  value="WORLD"
                  className="flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-xs"
                  aria-label={t("home.world")}
                >
                  <Image
                    src={MODE_IMAGES.WORLD.src}
                    alt=""
                    width={20}
                    height={20}
                    className="h-4 w-4 shrink-0 object-contain"
                  />
                  {t("home.world")}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="CONTINENTS"
                  className="flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-xs"
                  aria-label={t("home.continent")}
                >
                  <Image
                    src={MODE_IMAGES.CONTINENTS.src}
                    alt=""
                    width={20}
                    height={20}
                    className="h-4 w-4 shrink-0 object-contain"
                  />
                  {t("home.continent")}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="LEVEL_OF_THE_DAY"
                  className="flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-xs"
                  aria-label={t("home.daily")}
                >
                  <Image
                    src={MODE_IMAGES.LEVEL_OF_THE_DAY.src}
                    alt=""
                    width={20}
                    height={20}
                    className="h-4 w-4 shrink-0 object-contain"
                  />
                  {t("home.daily")}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Global rank for selected mode */}
            <div className="rounded-xl bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-xs font-medium text-[#0f2b3c]/70">
                {t("profile.globalRankInMode")} ({modeLabel})
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-lg font-bold text-[#0f2b3c]">
                <RankDisplay rank={data.stats.globalRank} />
              </p>
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
                  {filteredHistory.map((entry, i) => {
                    const modeImg = modeImageForEntry(entry)
                    return (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-4 py-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0f2b3c]/10 overflow-hidden">
                            <Image
                              src={modeImg.src}
                              alt={modeImg.alt}
                              width={20}
                              height={20}
                              className="object-contain"
                            />
                          </div>
                          <span className="font-medium text-[#0f2b3c]">
                            {t("profile.level")} {entry.level}
                          </span>
                        </div>
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
                    )
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
