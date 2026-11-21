import {
  CATALOGUE,
  HINT_COSTS,
  classicLevelAt,
  getDefinition,
  getStars,
  hasDefinition,
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
import { ChevronLeftIcon, CoinIcon, colors, fonts, MIN_TOUCH, PressableSurface, StarIcon } from "@marcel-games/expo-ui"
import { Keyboard } from "@/components/keyboard"
import { Ladder } from "@/components/ladder"
import { ladderLayout } from "@/game/layout"
import { bankClassicLevel } from "@/game/progress-store"
import { useGame } from "@/game/use-game"
import { earnCoinsForStars, useCoinBalance } from "@/game/wallet-store"
import { deviceLocale } from "@/lib/locale"

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
  const [hintsOpen, setHintsOpen] = useState(false)
  const [broke, setBroke] = useState(false)
  const coins = useCoinBalance()
  const { session, pressLetter, erase, hintFirstLetter, hintDefinition } = useGame(
    level,
    (finished) => {
      const earned = getStars(finished.attempts, level.wordLadder.length, finished.hintsUsed)
      void bankClassicLevel(levelIndex).then((firstTime) => {
        if (firstTime) earnCoinsForStars(earned)
      })
    }
  )
  const state = session.game

  const layout = ladderLayout({
    width,
    height: ladderHeight,
    letters: level.beginWord.length,
    rows: level.wordLadder.length + 2,
  })
  const target = level.wordLadder[state.currentWordIndex]
  const showHints = hintsOpen && !state.isComplete
  const stars = getStars(state.attempts, level.wordLadder.length, state.hintsUsed)

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <PressableSurface
          onPress={() => router.back()}
          accessibilityLabel={t(locale, "backToMenu")}
          face={colors.surface}
          border={colors.line}
          radius={12}
          height={MIN_TOUCH}
          outerStyle={styles.back}
        >
          <ChevronLeftIcon size={20} color={colors.ink} />
        </PressableSurface>
        <Text accessibilityRole="header" style={styles.title}>
          {t(locale, "level")} {levelIndex + 1}
        </Text>
        <View
          accessible
          accessibilityLabel={`${coins ?? 0} ${t(locale, "coins")}`}
          style={styles.coins}
        >
          <CoinIcon color={colors.star} />
          <Text style={styles.coinsLabel}>{coins ?? "–"}</Text>
        </View>
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

      {showHints && (
        <View style={styles.hints}>
          <View style={styles.hintButtons}>
            <PressableSurface
              onPress={() => setBroke(!hintFirstLetter())}
              accessibilityLabel={t(locale, "firstLetter")}
              face={colors.surface}
              border={colors.line}
              radius={12}
              height={MIN_TOUCH}
              style={styles.hintFace}
              outerStyle={styles.hintButton}
            >
              <Text style={styles.hintLabel}>{t(locale, "firstLetter")}</Text>
              {!session.hinted.firstLetter && (
                <Text style={styles.hintCost}>{HINT_COSTS.firstLetter}</Text>
              )}
            </PressableSurface>
            {hasDefinition(target, locale) && (
              <PressableSurface
                onPress={() => setBroke(!hintDefinition())}
                accessibilityLabel={t(locale, "definition")}
                face={colors.surface}
                border={colors.line}
                radius={12}
                height={MIN_TOUCH}
                style={styles.hintFace}
                outerStyle={styles.hintButton}
              >
                <Text style={styles.hintLabel}>{t(locale, "definition")}</Text>
                {!session.hinted.definition && (
                  <Text style={styles.hintCost}>{HINT_COSTS.definition}</Text>
                )}
              </PressableSurface>
            )}
          </View>
          {broke && (
            <Text accessibilityLiveRegion="polite" style={styles.broke}>
              {t(locale, "notEnoughCoins")}
            </Text>
          )}
          {session.hinted.definition && (
            <Text accessibilityLiveRegion="polite" style={styles.definition}>
              {getDefinition(target, locale)}
            </Text>
          )}
        </View>
      )}

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
                  color={index < stars ? colors.star : colors.starOff}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.subStatus}>{wordsLeftLabel(state, locale)}</Text>
          )}
        </View>
        {!state.isComplete && (
          <PressableSurface
            onPress={() => setHintsOpen((open) => !open)}
            accessibilityLabel={t(locale, "hints")}
            face={hintsOpen ? colors.tray : colors.surface}
            border={colors.line}
            radius={12}
            height={MIN_TOUCH}
            style={styles.next}
          >
            <Text style={styles.hintLabel}>{t(locale, "hints")}</Text>
          </PressableSurface>
        )}
        {state.isComplete && (
          <PressableSurface
            onPress={() =>
              router.replace({ pathname: "/game", params: { index: String(levelIndex + 1) } })
            }
            accessibilityLabel={t(locale, "nextLevel")}
            face={colors.ink}
            radius={12}
            height={MIN_TOUCH}
            style={styles.next}
          >
            <Text style={styles.nextLabel}>{t(locale, "nextLevel")}</Text>
          </PressableSurface>
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
  header: {
    height: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: { width: MIN_TOUCH },
  title: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  ladderArea: { flex: 1 },
  statusRow: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  statusText: { flexShrink: 1, gap: 2 },
  status: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  subStatus: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  stars: { flexDirection: "row", gap: 2 },
  hints: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  hintButtons: { flexDirection: "row", gap: 10 },
  hintButton: { flex: 1 },
  hintFace: { flexDirection: "row", gap: 8 },
  hintCost: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.star },
  broke: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.danger },
  coins: {
    minWidth: MIN_TOUCH,
    height: MIN_TOUCH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  coinsLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  hintLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  definition: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.inkSoft },
  next: { paddingHorizontal: 18 },
  nextLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.surface },
})
