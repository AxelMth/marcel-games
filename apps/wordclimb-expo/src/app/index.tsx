import { t } from "@marcel-games/wordclimb-core"
import { useRouter } from "expo-router"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { Pressable } from "react-native-gesture-handler"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { PressableSurface, Surface } from "@marcel-games/expo-ui"
import { retryLoadProgress, useProgress } from "@/game/progress-store"
import { openLegalPage } from "@/lib/legal"
import { deviceLocale } from "@/lib/locale"
import { colors, fonts, MIN_TOUCH } from "@marcel-games/expo-ui"

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

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 4 }]}>
      <View style={styles.hero}>
        <View accessible accessibilityRole="header" accessibilityLabel="WordClimb">
          <WordmarkRow word="WORD" face={colors.found} />
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
            face={colors.ink}
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

        <Pressable
          accessibilityRole="link"
          onPress={() => void openLegalPage()}
          style={styles.legal}
        >
          <Text style={styles.legalLabel}>{t(locale, "legalOpen")}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
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
  legal: { minHeight: MIN_TOUCH, alignItems: "center", justifyContent: "center" },
  legalLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    textDecorationLine: "underline",
  },
  playLabel: { fontFamily: fonts.display, fontSize: 22, color: colors.surface },
  levelChip: {
    height: 36,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
    backgroundColor: colors.inkSoft,
  },
  levelChipText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.surface },
})
