import {
  CATALOGUE,
  classicLevelAt,
  getStars,
  t,
  type GameState,
  type Level,
  type Locale,
  type TranslationKey,
} from "@marcel-games/wordclimb-core"
import { Redirect, useLocalSearchParams, useRouter } from "expo-router"
import { useState } from "react"
import { StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ChevronLeftIcon, StarIcon } from "@/components/icons"
import { Keyboard } from "@/components/keyboard"
import { Ladder } from "@/components/ladder"
import { PressableLip } from "@/components/lipped"
import { ladderLayout } from "@/game/layout"
import { bankClassicLevel } from "@/game/progress-store"
import { useGame } from "@/game/use-game"
import { deviceLocale } from "@/lib/locale"
import { colors, fonts, MIN_TOUCH } from "@/theme/tokens"

const MAX_STARS = 3

function parseLevelIndex(raw: string | string[] | undefined): number | null {
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) return null
  return Number.parseInt(raw, 10)
}

function statusKey(state: GameState): TranslationKey {
  if (state.isComplete) return "completeLevel"
  switch (state.feedback) {
    case "correct":
      return "correct"
    case "wrong":
      return "wrong"
    case "already":
      return "alreadyFound"
    default:
      return "findTheWord"
  }
}

function wordsLeftLabel(state: GameState, locale: Locale): string {
  const left = state.level.wordLadder.length - state.currentWordIndex
  return `${left} ${t(locale, left === 1 ? "wordLeft" : "wordsLeft")}`
}

export default function GameRoute() {
  const params = useLocalSearchParams<{ index?: string }>()
  const levelIndex = parseLevelIndex(params.index)
  if (levelIndex === null) return <Redirect href="/" />

  const locale = deviceLocale()
  return (
    <Game
      key={`${locale}-${levelIndex}`}
      level={classicLevelAt(CATALOGUE[locale], levelIndex)}
      levelIndex={levelIndex}
      locale={locale}
    />
  )
}

function Game({ level, levelIndex, locale }: { level: Level; levelIndex: number; locale: Locale }) {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const router = useRouter()
  const [ladderHeight, setLadderHeight] = useState(0)
  const { session, pressLetter, erase } = useGame(level, () => {
    void bankClassicLevel(levelIndex)
  })
  const state = session.game

  const layout = ladderLayout({
    width,
    height: ladderHeight,
    letters: level.beginWord.length,
    rows: level.wordLadder.length + 2,
  })
  const stars = getStars(state.attempts, level.wordLadder.length, state.hintsUsed)

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.halo} />

      <View style={styles.header}>
        <PressableLip
          onPress={() => router.back()}
          accessibilityLabel={t(locale, "backToMenu")}
          face={colors.surface}
          lip={colors.surfaceLip}
          radius={14}
          height={MIN_TOUCH}
          depth={3}
          style={styles.back}
        >
          <ChevronLeftIcon color={colors.ink} />
        </PressableLip>
        <Text accessibilityRole="header" style={styles.title}>
          {t(locale, "level")} {levelIndex + 1}
        </Text>
        <View style={styles.back} />
      </View>

      <View
        style={styles.ladderArea}
        onLayout={(event) => setLadderHeight(event.nativeEvent.layout.height)}
      >
        {ladderHeight > 0 && (
          <Ladder
            session={session}
            layout={layout}
            viewportHeight={ladderHeight}
            locale={locale}
          />
        )}
      </View>

      <View style={styles.statusRow}>
        <View style={styles.statusText}>
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {t(locale, statusKey(state))}
          </Text>
          {state.isComplete ? (
            <View
              accessible
              accessibilityLabel={`${stars} / ${MAX_STARS}`}
              style={styles.stars}
            >
              {Array.from({ length: MAX_STARS }, (_, index) => (
                <StarIcon
                  key={index}
                  size={20}
                  color={index < stars ? colors.star : colors.surfaceLip}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.subStatus}>{wordsLeftLabel(state, locale)}</Text>
          )}
        </View>
        {state.isComplete && (
          <PressableLip
            onPress={() =>
              router.replace({ pathname: "/game", params: { index: String(levelIndex + 1) } })
            }
            accessibilityLabel={t(locale, "nextLevel")}
            face={colors.primary}
            lip={colors.primaryLip}
            radius={14}
            height={MIN_TOUCH}
            depth={3}
            faceStyle={styles.next}
          >
            <Text style={styles.nextLabel}>{t(locale, "nextLevel")}</Text>
          </PressableLip>
        )}
      </View>

      <Keyboard
        locale={locale}
        onLetter={pressLetter}
        onErase={erase}
        disabled={state.isComplete}
        bottomInset={insets.bottom}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  halo: {
    position: "absolute",
    alignSelf: "center",
    top: 140,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: colors.halo,
  },
  header: {
    height: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: { width: MIN_TOUCH },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  ladderArea: { flex: 1 },
  statusRow: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  statusText: { flexShrink: 1, gap: 2 },
  status: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  subStatus: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  stars: { flexDirection: "row", gap: 2 },
  next: { paddingHorizontal: 16 },
  nextLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.surface },
})
