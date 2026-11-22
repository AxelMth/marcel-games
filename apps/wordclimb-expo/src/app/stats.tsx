import { StatsScreen, type HistoryItem } from "@marcel-games/expo-ui"
import { t, type HistoryEntry, type Locale } from "@marcel-games/wordclimb-core"
import type { Profile } from "@marcel-games/game-sync"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { currentUserId, fetchProfile } from "@/game/sync"
import { brand } from "@/lib/brand"
import { deviceLocale } from "@/lib/locale"

const DAILY_MODE = "LEVEL_OF_THE_DAY"

const rankLabel = (rank: number) => (rank > 0 ? String(rank) : "–")

function toItem(entry: HistoryEntry, index: number, locale: Locale): HistoryItem {
  const daily = entry.gameMode === DAILY_MODE
  return {
    key: `${index}-${entry.gameMode}-${entry.level}`,
    badge: daily ? t(locale, "dailyBadge") : String(entry.level),
    badgeFace: daily ? brand.dailySoft : brand.accentSoft,
    badgeInk: daily ? "#8A4A17" : brand.accentDeep,
    title: `${entry.beginWord} → ${entry.endWord}`.toUpperCase(),
    subtitle: entry.rank > 0 ? t(locale, "rankN").replace("{n}", String(entry.rank)) : t(locale, "profileNotRanked"),
    stars: entry.stars,
    tab: daily ? "daily" : "levels",
  }
}

export default function StatsRoute() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const locale = deviceLocale()
  const [profile, setProfile] = useState<Profile<HistoryEntry> | "loading" | "error">("loading")

  const load = useCallback(() => {
    setProfile("loading")
    currentUserId()
      .then(fetchProfile)
      .then(setProfile)
      .catch((error: unknown) => {
        console.warn("The WordClimb profile could not be read", error)
        setProfile("error")
      })
  }, [])

  useEffect(load, [load])

  const ready = typeof profile === "object" ? profile : null
  return (
    <StatsScreen
      insets={insets}
      title={t(locale, "rankingTitle")}
      backLabel={t(locale, "profileBack")}
      onBack={() => router.back()}
      ground={brand.accentSoft}
      tabTray="#CDE8DC"
      state={ready ? "ready" : profile === "error" ? "error" : "loading"}
      errorLabel={t(locale, "statsOfflineHint")}
      retryLabel={t(locale, "retry")}
      onRetry={load}
      emptyLabel={t(locale, "profileNoHistory")}
      tiles={[
        {
          value: rankLabel(ready?.stats.lastLevelRank ?? 0),
          label: t(locale, "profileTodaysRank"),
          face: brand.accent,
          ink: "#FFFFFF",
          muted: "#D9F0E6",
        },
        {
          value: rankLabel(ready?.stats.globalRank ?? 0),
          label: t(locale, "profileGlobalRank"),
          face: "#FFFFFF",
          ink: "#14202B",
          muted: "#55655C",
        },
        {
          value: String(ready?.stats.dailyLevelsCompleted ?? 0),
          label: t(locale, "profileDaysCompleted"),
          face: brand.dailySoft,
          ink: "#14202B",
          muted: "#8A4A17",
        },
      ]}
      tabs={[
        { key: "all", label: t(locale, "tabAll") },
        { key: "levels", label: t(locale, "tabLevels") },
        { key: "daily", label: t(locale, "tabDaily") },
      ]}
      items={ready ? ready.history.map((entry, index) => toItem(entry, index, locale)) : []}
    />
  )
}
