import { t } from "@marcel-games/wordclimb-core"
import { useRouter } from "expo-router"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { CoinCounter, colors, fonts, LegalLink, PressableSurface, Surface } from "@marcel-games/expo-ui"
import { daily } from "@/game/daily-store"
import { retryLoadProgress, useProgress } from "@/game/progress-store"
import { useCoinBalance } from "@/game/wallet-store"
import { brand } from "@/lib/brand"
import { deviceLocale } from "@/lib/locale"

// Published from legal/ by the legal-pages workflow; the same URL goes into App Store Connect.
const LEGAL_URL = "https://axelmth.github.io/marcel-games/wordclimb-privacy-and-terms"

const WORDMARK_TILE = 44
const WORDMARK_GAP = 6
const WORDMARK_STEP = 50

function WordmarkRow({ word, face }: { word: string; face: string }) {
  return (
    <View style={styles.wordmarkRow}>
      {[...word].map((letter, index) => (
        <Surface
          key={index}
          face={face}
          radius={8}
          height={WORDMARK_TILE}
          style={styles.wordmarkTile}
        >
          <Text style={styles.wordmarkLetter}>{letter}</Text>
        </Surface>
      ))}
    </View>
  )
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const locale = deviceLocale()
  const progress = useProgress()
  const today = daily.useToday()
  const coins = useCoinBalance()
  const dailyDone = today?.done ?? false
  const globalRank = today?.stats?.globalRank ?? 0
  const dailyNote = !dailyDone
    ? globalRank > 0
      ? `${t(locale, "profileGlobalRank")} : ${globalRank}`
      : t(locale, "dailyChallengeDesc")
    : today?.stats && today.stats.todayRank > 0
      ? `${t(locale, "doneForToday")} ${t(locale, "profileTodaysRank")} : ${today.stats.todayRank}`
      : t(locale, "doneForToday")

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 4 }]}>
      <View style={styles.topBar}>
        <CoinCounter value={coins} accessibilityLabel={`${coins ?? 0} ${t(locale, "coins")}`} />
      </View>
      <View style={styles.hero}>
        <View accessible accessibilityRole="header" accessibilityLabel="WordClimb">
          <WordmarkRow word="WORD" face={brand.accent} />
          <View style={styles.wordmarkSecondRow}>
            <WordmarkRow word="CLIMB" face={colors.ink} />
          </View>
        </View>
        <Text style={styles.tagline}>{t(locale, "tagline")}</Text>
      </View>

      <View style={styles.actions}>
        {progress.status === "loading" && <ActivityIndicator color={colors.ink} />}

        {progress.status === "error" && (
          <>
            <Text style={styles.error}>{t(locale, "progressError")}</Text>
            <PressableSurface
              onPress={() => void retryLoadProgress()}
              accessibilityLabel={t(locale, "retry")}
              face={colors.surface}
              border={colors.line}
              radius={14}
              height={56}
            >
              <Text style={styles.retry}>{t(locale, "retry")}</Text>
            </PressableSurface>
          </>
        )}

        {progress.status === "ready" && (
          <PressableSurface
            onPress={() =>
              router.push({ pathname: "/game", params: { index: String(progress.progress) } })
            }
            accessibilityLabel={`${t(locale, "play")}, ${t(locale, "level")} ${progress.progress + 1}`}
            face={brand.accent}
            radius={14}
            height={64}
            style={styles.play}
          >
            <Text style={styles.playLabel}>{t(locale, "play")}</Text>
            <View style={styles.levelChip}>
              <Text style={styles.levelChipText}>
                {t(locale, "level")} {progress.progress + 1}
              </Text>
            </View>
          </PressableSurface>
        )}

        {progress.status === "ready" && (
          <PressableSurface
            onPress={() => router.push({ pathname: "/game", params: { daily: "1" } })}
            accessibilityLabel={`${t(locale, "dailyChallenge")}, ${dailyNote}`}
            disabled={dailyDone}
            face={dailyDone ? colors.surface : brand.dailySoft}
            border={dailyDone ? colors.line : brand.daily}
            radius={14}
            height={64}
            style={styles.daily}
          >
            <Text style={styles.dailyTitle}>{t(locale, "dailyChallenge")}</Text>
            <Text style={styles.dailyNote}>{dailyNote}</Text>
          </PressableSurface>
        )}

        <LegalLink url={LEGAL_URL} label={t(locale, "legalOpen")} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.accentSoft },
  topBar: { height: 48, paddingHorizontal: 16, alignItems: "flex-end", justifyContent: "center" },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", gap: 28 },
  wordmarkRow: { flexDirection: "row", gap: WORDMARK_GAP },
  wordmarkSecondRow: { marginTop: WORDMARK_GAP, marginLeft: WORDMARK_STEP },
  wordmarkTile: { width: WORDMARK_TILE },
  wordmarkLetter: {
    alignSelf: "stretch",
    textAlign: "center",
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.surface,
  },
  tagline: { fontFamily: fonts.body, fontSize: 16, color: colors.muted },
  actions: { paddingHorizontal: 16, gap: 12, minHeight: 73, justifyContent: "flex-end" },
  error: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, textAlign: "center" },
  retry: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  play: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 22,
    paddingRight: 14,
  },
  daily: { alignItems: "flex-start", paddingHorizontal: 22, gap: 2 },
  dailyTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  dailyNote: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  playLabel: { fontFamily: fonts.display, fontSize: 22, color: colors.surface },
  levelChip: {
    height: 36,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
    backgroundColor: brand.accentDeep,
  },
  levelChipText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.surface },
})
