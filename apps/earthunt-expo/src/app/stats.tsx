import { t, tReplace, type HistoryEntry } from "@marcel-games/earthunt-core"
import { StatsScreen, colors, type HistoryItem, type StatTile } from "@marcel-games/expo-ui"
import type { Profile } from "@marcel-games/game-sync"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { fetchProfile } from "@/game/sync"
import { CONTINENT_COLORS } from "@/lib/continents"
import { deviceLocale } from "@/lib/locale"

const NAVY = "#16202B"
const NAVY_TINT = "#DDE3EA"
const DAILY_FACE = "#FFEBDC"
const DAILY_INK = "#B85C14"
const MODE_DAILY = "LEVEL_OF_THE_DAY"

type State = { status: "loading" } | { status: "error" } | { status: "ready"; profile: Profile<HistoryEntry> }

function tint(hex: string): string {
  const channel = (offset: number) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16)
    return Math.round(value + (255 - value) * 0.82)
      .toString(16)
      .padStart(2, "0")
  }
  return `#${channel(1)}${channel(3)}${channel(5)}`
}

export default function StatsRoute() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const locale = deviceLocale()
  const [state, setState] = useState<State>({ status: "loading" })

  const load = useCallback(() => {
    setState({ status: "loading" })
    fetchProfile().then(
      (profile) => setState({ status: "ready", profile }),
      (error: unknown) => {
        console.warn("Could not load the profile", error)
        setState({ status: "error" })
      }
    )
  }, [])

  useEffect(load, [load])

  const { tiles, items } = useMemo(() => {
    if (state.status !== "ready") return { tiles: [] as StatTile[], items: [] as HistoryItem[] }
    const { stats, history } = state.profile
    const rank = (value: number) => (value > 0 ? String(value) : "–")
    const tiles: StatTile[] = [
      { value: rank(stats.lastLevelRank), label: t(locale, "profile.todaysRank"), face: NAVY, ink: colors.surface, muted: colors.starOff },
      { value: rank(stats.globalRank), label: t(locale, "profile.rankGlobal"), face: colors.surface, ink: colors.ink, muted: colors.muted },
      { value: String(stats.dailyLevelsCompleted), label: t(locale, "profile.challengesWon"), face: DAILY_FACE, ink: colors.ink, muted: DAILY_INK },
    ]
    const items = history.map((entry, index): HistoryItem => {
      const isDaily = entry.gameMode === MODE_DAILY
      const accent = CONTINENT_COLORS[entry.continent]
      const subtitle = entry.rank > 0 ? tReplace(locale, "profile.rank", { n: entry.rank }) : t(locale, "profile.unranked")
      return {
        key: `${index}-${entry.gameMode}-${entry.level}`,
        badge: isDaily ? t(locale, "profile.dailyBadge") : String(entry.level),
        badgeFace: isDaily ? "#F08A3C" : accent ? tint(accent) : NAVY_TINT,
        badgeInk: isDaily ? colors.surface : (accent ?? NAVY),
        title: isDaily
          ? t(locale, "home.daily")
          : accent
            ? t(locale, `continentSelect.${entry.continent}`)
            : t(locale, "home.world"),
        subtitle,
        stars: Math.min(entry.stars, 3),
        tab: isDaily ? "daily" : "levels",
      }
    })
    return { tiles, items }
  }, [locale, state])

  return (
    <StatsScreen
      insets={insets}
      title={t(locale, "profile.title")}
      backLabel={t(locale, "profile.back")}
      onBack={() => router.back()}
      ground="#E4F1FA"
      tabTray="#CFE3F2"
      state={state.status}
      errorLabel={t(locale, "profile.loadError")}
      retryLabel={t(locale, "profile.retry")}
      onRetry={load}
      emptyLabel={t(locale, "profile.noHistory")}
      tiles={tiles}
      tabs={[
        { key: "all", label: t(locale, "profile.tabAll") },
        { key: "levels", label: t(locale, "profile.tabLevels") },
        { key: "daily", label: t(locale, "profile.tabDaily") },
      ]}
      items={items}
    />
  )
}
