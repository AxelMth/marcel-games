import {
  CATALOGUE,
  HINT_COSTS,
  classicLevelAt,
  dailyLevelIndexFor,
  getDefinition,
  getStars,
  hasDefinition,
  t,
  toBackendGameMode,
  toBackendLocale,
  utcDateString,
  type GameState,
  type Level,
  type Locale,
  type TranslationKey,
} from "@marcel-games/wordclimb-core"
import { Redirect, useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ChevronLeftIcon, CoinIcon, colors, fonts, MIN_TOUCH, PressableSurface, StarIcon } from "@marcel-games/expo-ui"
import { Keyboard } from "@/components/keyboard"
import { Ladder } from "@/components/ladder"
import { daily } from "@/game/daily-store"
import { ladderLayout } from "@/game/layout"
import { bankClassicLevel } from "@/game/progress-store"
import { reportLevel, whenFirstSynced } from "@/game/sync"
import { useGame } from "@/game/use-game"
import { earnCoinsForStars, loadWallet, useCoinBalance } from "@/game/wallet-store"
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

/**
 * Today's challenge. The puzzle is settled once, after the server has been
 * asked: a day already finished elsewhere must not be offered again, and the
 * store marks the day done the moment the last word is found, so reading it
 * again then would pull the ladder away from under the celebration.
 */
function DailyRoute({ locale }: { locale: Locale }) {
  const [settled, setSettled] = useState<{ level: Level | null; day: string } | null>(null)

  useEffect(() => {
    let left = false
    void whenFirstSynced().then(() => {
      if (left) return
      const today = daily.today()
      const day = utcDateString()
      // Without an answer from the server the game builds the puzzle itself; the
      // server derives the same one from the date.
      const levels = CATALOGUE[locale]
      const fallback = classicLevelAt(levels, dailyLevelIndexFor(day, levels.length))
      setSettled({ level: today?.done ? null : (today?.puzzle ?? fallback), day })
    })
    return () => {
      left = true
    }
  }, [locale])

  if (!settled) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator color={colors.ink} />
      </View>
    )
  }
  if (!settled.level) return <Redirect href="/" />
  return <Game level={settled.level} levelIndex={null} dailyDay={settled.day} locale={locale} />
}

export default function GameRoute() {
  const params = useLocalSearchParams<{ index?: string; daily?: string }>()
  const locale = deviceLocale()
  if (params.daily === "1") return <DailyRoute locale={locale} />

  const levelIndex = parseLevelIndex(params.index)
  if (levelIndex === null) return <Redirect href="/" />

  return (
    <Game
      key={`${locale}-${levelIndex}`}
      level={classicLevelAt(CATALOGUE[locale], levelIndex)}
      levelIndex={levelIndex}
      locale={locale}
    />
  )
}

interface GameProps {
  level: Level
  /** The level's place in the classic catalogue, or null for the daily challenge. */
  levelIndex: number | null
  /** The UTC day the daily challenge was opened on. */
  dailyDay?: string
  locale: Locale
}

function Game({ level, levelIndex, dailyDay, locale }: GameProps) {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const router = useRouter()
  const [ladderHeight, setLadderHeight] = useState(0)
  const [hintsOpen, setHintsOpen] = useState(false)
  const [broke, setBroke] = useState(false)
  const coins = useCoinBalance()
  const today = daily.useToday()
  const { session, pressLetter, erase, hintFirstLetter, hintDefinition } = useGame(
    levelIndex === null ? "daily" : "classic",
    level,
    (finished) => {
      const earned = getStars(finished.attempts, level.wordLadder.length, finished.hintsUsed)
      const banked =
        levelIndex === null
          ? daily.markDone(dailyDay ?? "")
          : whenFirstSynced().then(() => bankClassicLevel(levelIndex))
      void banked.then((firstTime) => {
        if (!firstTime) return
        // The wallet may still be loading right after launch; earning into a closed one would drop the coins.
        void loadWallet().then(() => earnCoinsForStars(earned))
        void reportLevel({
          attempts: finished.attempts,
          timeSpent: Math.max(0, Math.floor((Date.now() - finished.startTime) / 1000)),
          hintsUsed: finished.hintsUsed,
          gameMode: toBackendGameMode(finished.mode),
          locale: toBackendLocale(locale),
          beginWord: level.beginWord,
          endWord: level.endWord,
          wordLadder: level.wordLadder,
        })
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
          {levelIndex === null
            ? t(locale, "dailyChallenge")
            : `${t(locale, "level")} ${levelIndex + 1}`}
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
              {levelIndex === null && today?.stats && today.stats.todayRank > 0 && (
                <Text style={styles.rank}>
                  {t(locale, "profileTodaysRank")} : {today.stats.todayRank}
                </Text>
              )}
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
              levelIndex === null
                ? router.back()
                : router.replace({ pathname: "/game", params: { index: String(levelIndex + 1) } })
            }
            accessibilityLabel={t(locale, levelIndex === null ? "backToMenu" : "nextLevel")}
            face={colors.ink}
            radius={12}
            height={MIN_TOUCH}
            style={styles.next}
          >
            <Text style={styles.nextLabel}>
              {t(locale, levelIndex === null ? "backToMenu" : "nextLevel")}
            </Text>
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
  waiting: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ground,
  },
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
  stars: { flexDirection: "row", alignItems: "center", gap: 2 },
  rank: { marginLeft: 8, fontFamily: fonts.body, fontSize: 13, color: colors.muted },
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
