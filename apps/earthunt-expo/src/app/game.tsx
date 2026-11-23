import {
  countries,
  createGameConfig,
  getCountriesByCodes,
  getCountryName,
  getFlagEmoji,
  getStars,
  HINT_STEP_COSTS,
  t,
  tReplace,
  type Continent,
  type CountryLocale,
  type GameConfig,
  type GuessVerdict,
  suggestCountries,
} from "@marcel-games/earthunt-core"
import {
  ChevronLeftIcon,
  CoinCounter,
  GoldCoin,
  InfoBubble,
  LevelComplete,
  MIN_TOUCH,
  PressableSurface,
  Toast,
  colors,
  fonts,
  useFlash,
} from "@marcel-games/expo-ui"
import { Redirect, useLocalSearchParams, useRouter } from "expo-router"
import { AD_REWARD_COINS, utcDay } from "@marcel-games/game-sync"
import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { WorldMap } from "@/components/world-map"
import { daily } from "@/game/daily-store"
import { bankLevel } from "@/game/progress-store"
import { reportLevel, whenFirstSynced } from "@/game/sync"
import { useCoinsAd } from "@/game/ads"
import { earnCoinsForStars, loadWallet, useCoinBalance } from "@/game/wallet-store"
import { useLevel, type LevelPlay } from "@/game/use-level"
import { deviceLocale } from "@/lib/locale"

const NAVY = "#16202B"
const OCHRE = "#E3A33B"
const CONTINENTS: readonly Continent[] = ["EUROPE", "ASIA", "AMERICAS", "AFRICA", "OCEANIA"]

function parseLevel(raw: string | string[] | undefined): number | null {
  if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw)) return null
  return Number.parseInt(raw, 10)
}

function parseContinent(raw: string | string[] | undefined): Continent | undefined | null {
  if (raw === undefined) return undefined
  return CONTINENTS.find((continent) => continent === raw) ?? null
}

function verdictMessage(verdict: GuessVerdict, locale: CountryLocale): string {
  if (!verdict.country) return t(locale, "game.unknownCountry")
  const country = getCountryName(verdict.country, locale)
  switch (verdict.outcome) {
    case "correct":
      return tReplace(locale, "game.found", { country })
    case "already-found":
      return tReplace(locale, "game.alreadyFound", { country })
    default:
      return tReplace(locale, "game.notMissing", { country })
  }
}

function hintMessage(play: LevelPlay, locale: CountryLocale): string | null {
  if (!play.hintTarget || play.hintStep === 0) return null
  if (play.hintStep === 3) {
    return tReplace(locale, "game.revealed", { country: getCountryName(play.hintTarget, locale) })
  }
  const letter = tReplace(locale, "hintsHelp.startsWith", { letter: play.firstLetter(locale) })
  return play.hintStep === 2 ? `${letter} · ${t(locale, "hintsHelp.mapHintResult")}` : letter
}

/** A level built from the countries the server picked for today. */
function dailyConfig(codes: readonly string[]): GameConfig {
  return {
    mode: "daily",
    level: 1,
    missingCountries: getCountriesByCodes([...codes]),
    allCountries: countries,
  }
}

/**
 * Today's challenge. The puzzle is settled once, after the server has been
 * asked: a day already finished elsewhere must not be offered again, and the
 * store marks the day done the moment the last country is found, so reading it
 * again then would pull the level away from under the result.
 */
function DailyRoute() {
  const [settled, setSettled] = useState<{ config: GameConfig | null; day: string } | null>(null)

  useEffect(() => {
    let left = false
    void whenFirstSynced().then(() => {
      if (left) return
      const today = daily.today()
      // Without an answer from the server the game builds a puzzle from the date.
      const config = today?.puzzle ? dailyConfig(today.puzzle) : createGameConfig("daily")
      const playable = !today?.done && config.missingCountries.length > 0
      setSettled({ config: playable ? config : null, day: utcDay(new Date()) })
    })
    return () => {
      left = true
    }
  }, [])

  if (!settled) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator color={colors.ink} />
      </View>
    )
  }
  if (!settled.config) return <Redirect href="/" />
  return <Game config={settled.config} dailyDay={settled.day} />
}

export default function GameRoute() {
  const params = useLocalSearchParams<{ level?: string; continent?: string; daily?: string }>()
  if (params.daily === "1") return <DailyRoute />

  const level = parseLevel(params.level)
  const continent = parseContinent(params.continent)
  if (level === null || continent === null) return <Redirect href="/" />

  const config = createGameConfig(continent ? "continent" : "world", level, continent)
  return <Game key={`${continent ?? "world"}-${level}`} config={config} />
}

function Game({ config, dailyDay }: { config: GameConfig; dailyDay?: string }) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const locale = deviceLocale()
  const [input, setInput] = useState("")
  const isDaily = config.mode === "daily"
  const today = daily.useToday()
  const [flash, showFlash, hideFlash] = useFlash()
  const coinsAd = useCoinsAd()
  const balance = useCoinBalance()
  const counterRef = useRef<ComponentRef<typeof View>>(null)
  const [coinTarget, setCoinTarget] = useState<{ x: number; y: number } | null>(null)
  const [headerBottom, setHeaderBottom] = useState(insets.top + 52)
  // Coins won but not yet landed: the counter keeps showing the balance without them.
  const [reward, setReward] = useState<number | null>(null)
  const [inFlight, setInFlight] = useState(0)
  const coins = balance === null ? null : Math.max(0, balance - inFlight)
  const play = useLevel(config, (outcome) => {
    const stars = getStars(outcome.attempts, config.missingCountries.length, outcome.hintsUsed)
    const banked = isDaily
      ? daily.markDone(dailyDay ?? "")
      : whenFirstSynced().then(() => bankLevel(config.level, config.continent))
    void banked.then((firstTime) => {
      if (!firstTime) {
        setReward(0)
        return
      }
      setReward(stars)
      setInFlight(stars)
      // The wallet may still be loading right after launch; earning into a closed one would drop the coins.
      void loadWallet().then(() => earnCoinsForStars(stars))
      void reportLevel({
        ...outcome,
        gameMode: isDaily ? "LEVEL_OF_THE_DAY" : config.continent ? "CONTINENTS" : "WORLD",
        continent: config.continent ?? "",
        countryCodes: config.missingCountries.map((country) => country.code),
      })
    })
  })

  const left = config.missingCountries.length - play.found.length
  const title = isDaily
    ? t(locale, "home.daily")
    : config.continent
    ? tReplace(locale, "game.continentLevel", {
        continent: t(locale, `continentSelect.${config.continent}`),
        level: config.level,
      })
    : tReplace(locale, "game.worldLevel", { level: config.level })
  const hint = hintMessage(play, locale)

  const suggestions = useMemo(
    () => suggestCountries(input, config.allCountries, play.found, locale),
    [config.allCountries, input, locale, play.found]
  )

  const submit = (value: string) => {
    if (!value.trim()) return
    const verdict = play.guess(value)
    if (verdict.outcome === "correct") setInput("")
  }

  useEffect(() => {
    if (!play.isComplete) return
    counterRef.current?.measureInWindow((x, y, width, height) =>
      setCoinTarget({ x: x + width / 2, y: y + height / 2 })
    )
  }, [play.isComplete])

  const onHeaderLayout = (event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout
    setHeaderBottom(y + height)
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header} onLayout={onHeaderLayout}>
        <PressableSurface
          onPress={() => router.back()}
          accessibilityLabel={t(locale, "success.backToHome")}
          face={colors.surface}
          border={colors.line}
          radius={12}
          height={MIN_TOUCH}
          outerStyle={styles.side}
        >
          <ChevronLeftIcon size={20} color={colors.ink} />
        </PressableSurface>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <CoinCounter
          ref={counterRef}
          value={coins}
          accessibilityLabel={`${coins ?? 0} ${t(locale, "game.coins")}`}
        />
      </View>

      <View style={styles.mapArea}>
        <WorldMap
          playable={config.allCountries.map((country) => country.code)}
          missing={config.missingCountries.map((country) => country.code)}
          found={play.found}
          highlighted={play.hintStep >= 2 ? (play.hintTarget?.code ?? null) : null}
        />
        {!play.isComplete && hint && (
          <InfoBubble key={play.hintStep}>
            <Text style={styles.hint}>{hint}</Text>
          </InfoBubble>
        )}
        <Toast flash={flash} />
        {!play.isComplete && suggestions.length > 0 && (
          // One scrolling line: with the keyboard up the map is short, and wrapped chips covered it.
          <ScrollView
            horizontal
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
            style={styles.suggestions}
            contentContainerStyle={styles.suggestionsRow}
          >
            {suggestions.map((country) => {
              const name = getCountryName(country, locale)
              return (
                <PressableSurface
                  key={country.code}
                  onPress={() => submit(name)}
                  accessibilityLabel={name}
                  face={colors.surface}
                  radius={18}
                  height={36}
                  outerStyle={styles.chipShadow}
                  style={styles.chip}
                >
                  <Text style={styles.chipFlag}>{getFlagEmoji(country)}</Text>
                  <Text style={styles.chipLabel}>{name}</Text>
                </PressableSurface>
              )
            })}
          </ScrollView>
        )}
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.statusRow}>
          <View style={styles.statusText}>
            <Text accessibilityLiveRegion="polite" style={styles.status}>
              {play.isComplete
                ? t(locale, "game.levelComplete")
                : play.lastVerdict
                  ? verdictMessage(play.lastVerdict, locale)
                  : `${left} ${t(locale, left === 1 ? "game.missingOne" : "game.missing")}`}
            </Text>
          </View>
          {!play.isComplete && (
            <PressableSurface
              onPress={() => {
                if (play.takeHint()) return
                showFlash({
                  title: t(locale, "game.notEnoughCoins"),
                  detail: tReplace(locale, "game.nextHintCosts", {
                    n: HINT_STEP_COSTS[(play.hintStep + 1) as 1 | 2 | 3],
                  }),
                  action: coinsAd.ready
                    ? {
                        label: tReplace(locale, "game.watchAdForCoins", { n: AD_REWARD_COINS }),
                        onPress: () => {
                          hideFlash()
                          void coinsAd.watch()
                        },
                      }
                    : undefined,
                })
              }}
              accessibilityLabel={
                play.hintStep < 3
                  ? `${t(locale, "game.hint")}, ${HINT_STEP_COSTS[(play.hintStep + 1) as 1 | 2 | 3]} ${t(locale, "game.coins")}`
                  : t(locale, "game.hint")
              }
              disabled={play.hintStep === 3}
              face={NAVY}
              radius={12}
              height={MIN_TOUCH}
              style={styles.action}
            >
              <Text style={styles.actionLabelOnInk}>{t(locale, "game.hint")}</Text>
              {play.hintStep < 3 && (
                <View style={styles.cost}>
                  <GoldCoin size={16} />
                  <Text style={styles.costLabel}>
                    {HINT_STEP_COSTS[(play.hintStep + 1) as 1 | 2 | 3]}
                  </Text>
                </View>
              )}
            </PressableSurface>
          )}
        </View>

        {!play.isComplete && (
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => submit(input)}
            submitBehavior="submit"
            returnKeyType="done"
            autoCorrect={false}
            autoCapitalize="words"
            autoComplete="off"
            spellCheck={false}
            placeholder={t(locale, "game.enterCountryName")}
            placeholderTextColor={colors.muted}
            accessibilityLabel={t(locale, "game.enterCountryName")}
            style={styles.input}
          />
        )}
      </View>

      {play.isComplete && (
        <LevelComplete
          accent={NAVY}
          accentInk={NAVY}
          title={t(locale, "success.wellDone")}
          subtitle={
            isDaily && today?.stats && today.stats.todayRank > 0
              ? `${t(locale, "profile.todaysRank")} : ${today.stats.todayRank}`
              : t(locale, "game.levelComplete")
          }
          stars={play.stars}
          coins={reward}
          coinsLabel={(n) => (n === 1 ? t(locale, "game.coinWon") : tReplace(locale, "game.coinsWon", { n }))}
          noCoinsLabel={t(locale, "game.noNewCoins")}
          coinTarget={coinTarget}
          onCoinLanded={() => setInFlight((n) => Math.max(0, n - 1))}
          top={headerBottom}
          bottom={insets.bottom}
          primaryLabel={t(locale, isDaily ? "success.backToHome" : "success.nextLevel")}
          onPrimary={() =>
            isDaily
              ? router.back()
              : router.replace({
                  pathname: "/game",
                  params: { level: String(config.level + 1), continent: config.continent },
                })
          }
          secondaryLabel={isDaily ? undefined : t(locale, "success.backToHome")}
          onSecondary={isDaily ? undefined : () => router.back()}
        />
      )}
    </KeyboardAvoidingView>
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
    height: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  side: { width: MIN_TOUCH },
  title: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  panel: { paddingHorizontal: 16, paddingTop: 12, gap: 12, backgroundColor: colors.ground },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  statusText: { flexShrink: 1, minHeight: MIN_TOUCH, justifyContent: "center" },
  status: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  hint: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  action: { flexDirection: "row", gap: 8, paddingHorizontal: 18 },
  cost: { flexDirection: "row", alignItems: "center", gap: 3 },
  costLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: OCHRE },
  actionLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  actionLabelOnInk: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.surface },
  mapArea: { flex: 1, position: "relative" },
  suggestions: { position: "absolute", left: 0, right: 0, bottom: 10, zIndex: 1 },
  suggestionsRow: { paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
  chipShadow: {
    shadowColor: NAVY,
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  chip: { flexDirection: "row", gap: 6, paddingHorizontal: 12 },
  chipFlag: { fontSize: 18 },
  chipLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  input: {
    height: MIN_TOUCH,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
})
