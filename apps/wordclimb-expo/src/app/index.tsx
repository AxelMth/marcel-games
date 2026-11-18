import { t } from "@marcel-games/wordclimb-core"
import { useRouter } from "expo-router"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Lipped, PressableLip } from "@/components/lipped"
import { Mascot, MASCOT_HEIGHT } from "@/components/mascot"
import { retryLoadProgress, useProgress } from "@/game/progress-store"
import { deviceLocale } from "@/lib/locale"
import { colors, fonts, LIP } from "@/theme/tokens"

const WORDMARK_TILE = 44
const WORDMARK_GAP = 6
const WORDMARK_STEP = 56

function WordmarkRow({ word, face, lip }: { word: string; face: string; lip: string }) {
  return (
    <View style={styles.wordmarkRow}>
      {[...word].map((letter, index) => (
        <Lipped
          key={index}
          face={face}
          lip={lip}
          radius={12}
          height={WORDMARK_TILE}
          style={styles.wordmarkTile}
        >
          <Text style={styles.wordmarkLetter}>{letter}</Text>
        </Lipped>
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
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.halo} />

      <View style={styles.hero}>
        <View accessible accessibilityRole="header" accessibilityLabel="WordClimb">
          <WordmarkRow word="WORD" face={colors.found} lip={colors.foundLip} />
          <View style={styles.wordmarkSecondRow}>
            <WordmarkRow word="CLIMB" face={colors.ink} lip={colors.inkLip} />
          </View>
          <View style={styles.mascot}>
            <Mascot />
          </View>
        </View>
        <Text style={styles.tagline}>{t(locale, "tagline")}</Text>
      </View>

      <View style={styles.actions}>
        {progress.status === "loading" && <ActivityIndicator color={colors.primary} />}

        {progress.status === "error" && (
          <>
            <Text style={styles.error}>{t(locale, "progressError")}</Text>
            <PressableLip
              onPress={() => void retryLoadProgress()}
              accessibilityLabel={t(locale, "retry")}
              face={colors.surface}
              lip={colors.surfaceLip}
              radius={22}
              height={56}
            >
              <Text style={styles.retry}>{t(locale, "retry")}</Text>
            </PressableLip>
          </>
        )}

        {progress.status === "ready" && (
          <PressableLip
            onPress={() =>
              router.push({ pathname: "/game", params: { index: String(progress.progress) } })
            }
            accessibilityLabel={`${t(locale, "play")}, ${t(locale, "level")} ${progress.progress + 1}`}
            face={colors.primary}
            lip={colors.primaryLip}
            radius={22}
            height={68}
            depth={5}
            faceStyle={styles.play}
          >
            <Text style={styles.playLabel}>{t(locale, "play")}</Text>
            <View style={styles.levelChip}>
              <Text style={styles.levelChipText}>
                {t(locale, "level")} {progress.progress + 1}
              </Text>
            </View>
          </PressableLip>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  halo: {
    position: "absolute",
    alignSelf: "center",
    top: 90,
    width: 470,
    height: 470,
    borderRadius: 235,
    backgroundColor: colors.halo,
  },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", gap: 28 },
  wordmarkRow: { flexDirection: "row", gap: WORDMARK_GAP },
  wordmarkSecondRow: { marginTop: 8, marginLeft: WORDMARK_STEP },
  wordmarkTile: { width: WORDMARK_TILE },
  wordmarkLetter: {
    alignSelf: "stretch",
    textAlign: "center",
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.surface,
  },
  // Sits on the last tile of the lower row, in the gap the upper row leaves.
  mascot: {
    position: "absolute",
    right: -2,
    top: WORDMARK_TILE + LIP + 8 - MASCOT_HEIGHT + 4,
  },
  tagline: { fontFamily: fonts.body, fontSize: 17, color: colors.muted },
  actions: { paddingHorizontal: 16, gap: 12, minHeight: 73, justifyContent: "flex-end" },
  error: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, textAlign: "center" },
  retry: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  play: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 24,
    paddingRight: 16,
  },
  playLabel: { fontFamily: fonts.display, fontSize: 26, color: colors.surface },
  levelChip: {
    height: 36,
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: "center",
    backgroundColor: colors.primaryLip,
  },
  levelChipText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.surface },
})
