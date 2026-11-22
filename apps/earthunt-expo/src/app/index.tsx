import { t, type Continent } from "@marcel-games/earthunt-core"
import { CoinCounter, LegalLink, PressableSurface, colors, fonts, MIN_TOUCH } from "@marcel-games/expo-ui"
import { useCoinBalance } from "@/game/wallet-store"
import { useRouter } from "expo-router"
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, { Path } from "react-native-svg"
import { daily } from "@/game/daily-store"
import { retryLoadProgress, useProgress } from "@/game/progress-store"
import { CONTINENT_COLORS } from "@/lib/continents"
import { deviceLocale } from "@/lib/locale"

// Published from legal/ by the legal-pages workflow; the same URL goes into App Store Connect.
const LEGAL_URL = "https://axelmth.github.io/marcel-games/earthunt-privacy-and-terms"

const CONTINENTS: readonly Exclude<Continent, "ANTARCTICA">[] = ["EUROPE", "ASIA", "AMERICAS", "AFRICA", "OCEANIA"]
const OCHRE = "#E3A33B"
const NAVY = "#16202B"
const DAILY_FACE = "#FFEBDC"
const DAILY_BORDER = "#F08A3C"
const IMAGES = {
  world: require("../../assets/modes/earth-logo.webp"),
  daily: require("../../assets/modes/daily.webp"),
  EUROPE: require("../../assets/modes/europe.webp"),
  ASIA: require("../../assets/modes/asia.webp"),
  AMERICAS: require("../../assets/modes/americas.webp"),
  AFRICA: require("../../assets/modes/africa.webp"),
  OCEANIA: require("../../assets/modes/oceania.webp"),
} as const

function StatsIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M5 20V11M12 20V4M19 20v-6"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const locale = deviceLocale()
  const state = useProgress()
  const today = daily.useToday()
  const dailyDone = today?.done ?? false
  const globalRank = today?.stats?.globalRank ?? 0
  const dailyNote = !dailyDone
    ? globalRank > 0
      ? `${t(locale, "profile.globalRank")} : ${globalRank}`
      : t(locale, "home.dailySubtitle")
    : today?.stats && today.stats.todayRank > 0
      ? `${t(locale, "profile.todaysRank")} : ${today.stats.todayRank}`
      : t(locale, "home.doneForToday")
  const coins = useCoinBalance()
  const levelLabel = (level: number) => `${t(locale, "continentSelect.level")} ${level}`

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text accessibilityRole="header" style={styles.wordmark}>
          {t(locale, "app.title")}
        </Text>
        <View style={styles.topActions}>
          <PressableSurface
            onPress={() => router.push("/stats")}
            accessibilityLabel={t(locale, "home.statsLabel")}
            face={colors.surface}
            border={colors.line}
            radius={12}
            height={MIN_TOUCH}
            outerStyle={styles.statsButton}
          >
            <StatsIcon color={colors.ink} />
          </PressableSurface>
          <CoinCounter value={coins} accessibilityLabel={`${coins ?? 0} ${t(locale, "game.coins")}`} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {state.status === "loading" && <ActivityIndicator color={colors.ink} />}

        {state.status === "error" && (
          <PressableSurface
            onPress={() => void retryLoadProgress()}
            accessibilityLabel={t(locale, "errors.failedToLoad")}
            face={colors.surface}
            border={colors.line}
            radius={14}
            height={56}
          >
            <Text style={styles.rowTitle}>{t(locale, "errors.failedToLoad")}</Text>
          </PressableSurface>
        )}

        {state.status === "ready" && (
          <>
            <PressableSurface
              onPress={() =>
                router.push({ pathname: "/game", params: { level: String(state.progress.world) } })
              }
              accessibilityLabel={`${t(locale, "home.world")}, ${levelLabel(state.progress.world)}`}
              face={NAVY}
              radius={20}
              height={112}
              style={styles.worldCard}
            >
              <Image source={IMAGES.world} style={styles.worldImage} resizeMode="contain" />
              <View style={styles.rowText}>
                <Text style={styles.worldTitle}>{t(locale, "home.world")}</Text>
                <Text style={styles.worldSubtitle}>{t(locale, "home.worldSubtitle")}</Text>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{levelLabel(state.progress.world)}</Text>
                </View>
              </View>
            </PressableSurface>

            <PressableSurface
              onPress={() => router.push({ pathname: "/game", params: { daily: "1" } })}
              accessibilityLabel={`${t(locale, "home.daily")}, ${dailyNote}`}
              disabled={dailyDone}
              face={DAILY_FACE}
              border={DAILY_BORDER}
              radius={20}
              height={84}
              style={styles.dailyCard}
            >
              <Image source={IMAGES.daily} style={styles.dailyImage} resizeMode="contain" />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{t(locale, "home.daily")}</Text>
                <Text style={styles.rowLevel}>{dailyNote}</Text>
              </View>
            </PressableSurface>

            <Text style={styles.section}>{t(locale, "home.continents")}</Text>
            <View style={styles.grid}>
              {CONTINENTS.map((continent) => {
                const level = state.progress.continents[continent] ?? 1
                const name = t(locale, `continentSelect.${continent}`)
                const wide = continent === "OCEANIA"
                return (
                  <PressableSurface
                    key={continent}
                    onPress={() =>
                      router.push({ pathname: "/game", params: { level: String(level), continent } })
                    }
                    accessibilityLabel={`${name}, ${levelLabel(level)}`}
                    face={colors.surface}
                    border={colors.line}
                    radius={18}
                    height={wide ? 96 : 150}
                    outerStyle={wide ? styles.tileWide : styles.tile}
                    style={wide ? styles.tileContentWide : styles.tileContent}
                  >
                    <Image
                      source={IMAGES[continent]}
                      style={wide ? styles.tileImageWide : styles.tileImage}
                      resizeMode="contain"
                    />
                    <View style={wide ? styles.rowText : styles.tileText}>
                      <Text style={styles.rowTitle}>{name}</Text>
                      <Text style={[styles.tileLevel, { color: CONTINENT_COLORS[continent] }]}>
                        {levelLabel(level)}
                      </Text>
                    </View>
                  </PressableSurface>
                )
              })}
            </View>
          </>
        )}

        <LegalLink url={LEGAL_URL} label={t(locale, "legal.open")} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#E4F1FA" },
  topBar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  statsButton: { width: MIN_TOUCH },
  wordmark: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  rowText: { gap: 2, flexShrink: 1 },
  worldCard: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14 },
  worldImage: { width: 84, height: 84 },
  worldTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.surface },
  worldSubtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.starOff },
  chip: {
    alignSelf: "flex-start",
    marginTop: 6,
    height: 28,
    borderRadius: 10,
    paddingHorizontal: 10,
    justifyContent: "center",
    backgroundColor: OCHRE,
  },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 13, color: NAVY },
  dailyCard: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14 },
  dailyImage: { width: 60, height: 60 },
  section: {
    marginTop: 6,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.muted,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { width: "47.5%", flexGrow: 1 },
  tileWide: { width: "100%" },
  tileContent: { flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: 10 },
  tileContentWide: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14 },
  tileImage: { width: "100%", height: 74 },
  tileImageWide: { width: 74, height: 74 },
  tileText: { alignItems: "center", gap: 2 },
  tileLevel: { fontFamily: fonts.bodyBold, fontSize: 13 },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  rowLevel: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
})
