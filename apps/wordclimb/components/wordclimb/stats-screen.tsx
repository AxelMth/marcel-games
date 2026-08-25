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
  Star,
} from "lucide-react"
import { useApp } from "@/lib/app-context"
import { t } from "@/lib/i18n"
import { getProfile, type GameHistoryEntry, type ProfileResponse } from "@/lib/api"
import { LegalModal } from "@/components/wordclimb/legal-modal"
import { hasRank } from "@/lib/ranking"
import { ScreenHeader } from "./screen-header"

type GameModeFilter = "all" | "NORMAL" | "LEVEL_OF_THE_DAY"

/** The filters, in carousel order, with the icon and label each mode already uses. */
const MODE_FILTERS: {
  value: GameModeFilter
  icon: typeof BookOpen | null
  labelKey: "filterAll" | "classic" | "dailyChallenge"
}[] = [
  { value: "all", icon: null, labelKey: "filterAll" },
  { value: "NORMAL", icon: BookOpen, labelKey: "classic" },
  { value: "LEVEL_OF_THE_DAY", icon: Calendar, labelKey: "dailyChallenge" },
]

function formatGameMode(locale: "en" | "fr", mode: string): string {
  const filter = MODE_FILTERS.find((f) => f.value === mode)
  // Falls through to the raw enum for a mode no filter covers — RANDOM, which
  // the app no longer offers but whose old history rows still exist.
  if (!filter || filter.value === "all") return mode
  return t(locale, filter.labelKey)
}

/**
 * The ladder as the player solved it, begin and end words included — the
 * intermediate words on their own do not say which puzzle it was.
 */
function formatLadder(entry: GameHistoryEntry): string {
  const chain = [entry.beginWord, ...(entry.wordLadder ?? []), entry.endWord]
  return chain.filter(Boolean).join(" → ")
}

function filterHistory(
  entries: ProfileResponse["gameHistory"],
  filter: GameModeFilter
): ProfileResponse["gameHistory"] {
  if (filter === "all") return entries
  return entries.filter((e) => e.gameMode === filter)
}

export function StatsScreen() {
  const { locale, setLocale, goHome, userId } = useApp()
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
          "linear-gradient(180deg, #69bf8e 0%, #7ed7a5 40%, #ccebda 100%)",
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
                  {hasRank(data.stats.lastLevelRank)
                    ? `#${data.stats.lastLevelRank}`
                    : t(locale, "profileNotRanked")}
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
                  {hasRank(data.stats.globalRank)
                    ? `#${data.stats.globalRank}`
                    : t(locale, "profileNotRanked")}
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
                {MODE_FILTERS.map(({ value, icon: Icon, labelKey }) => (
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
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    {t(locale, labelKey)}
                  </button>
                ))}
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
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-medium text-[#0A3D62]">
                        {formatGameMode(locale, entry.gameMode)} —{" "}
                        {t(locale, "level")} {entry.level}
                      </span>
                      <span className="truncate text-xs text-[#0A3D62]/70">
                        {formatLadder(entry)}
                      </span>
                    </div>
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

        {/* Settings. The language lived in the home header, where it sat
            beside the title and pushed it off centre; earthunt's header carries
            nothing but the cog. */}
        <section className="mt-auto pt-6">
          <h2 className="mb-2 text-sm font-bold text-[#0A3D62]">
            {t(locale, "settingsTitle")}
          </h2>
          <div className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[#0A3D62]">
              <Globe className="h-5 w-5" />
              <span className="text-sm font-semibold">{t(locale, "language")}</span>
            </div>
            <div
              className="flex gap-1 rounded-full bg-[#0A3D62]/10 p-1"
              role="group"
              aria-label={t(locale, "language")}
            >
              {(["fr", "en"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  aria-pressed={locale === code}
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase transition-colors ${
                    locale === code
                      ? "bg-white text-[#0A3D62] shadow-sm"
                      : "text-[#0A3D62]/60"
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </section>

        <footer className="pt-6 text-center">
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
