import {
  countries,
  createGameConfig,
  getCountriesByCodes,
  getCountryName,
  t,
  tReplace,
  type Continent,
  type CountryLocale,
  type GameConfig,
  type GuessVerdict,
} from "@marcel-games/earthunt-core"
import {
  ChevronLeftIcon,
  MIN_TOUCH,
  PressableSurface,
  StarIcon,
  colors,
  fonts,
} from "@marcel-games/expo-ui"
import { Redirect, useLocalSearchParams, useRouter } from "expo-router"
import { utcDay } from "@marcel-games/game-sync"
import { useEffect, useState } from "react"
import { ActivityIndicator, KeyboardAvoidingView, StyleSheet, Text, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { WorldMap } from "@/components/world-map"
import { daily } from "@/game/daily-store"
import { bankLevel } from "@/game/progress-store"
import { reportLevel, whenFirstSynced } from "@/game/sync"
import { useLevel, type LevelPlay } from "@/game/use-level"
import { deviceLocale } from "@/lib/locale"

const MAX_STARS = 3
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
  const play = useLevel(config, (outcome) => {
    const banked = isDaily
      ? daily.markDone(dailyDay ?? "")
      : whenFirstSynced().then(() => bankLevel(config.level, config.continent))
    void banked.then((firstTime) => {
      if (!firstTime) return
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

  const submit = () => {
    if (!input.trim()) return
    const verdict = play.guess(input)
    if (verdict.outcome === "correct") setInput("")
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
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
        <View style={styles.side} />
      </View>

      <WorldMap
        playable={config.allCountries.map((country) => country.code)}
        missing={config.missingCountries.map((country) => country.code)}
        found={play.found}
        highlighted={play.hintStep >= 2 ? (play.hintTarget?.code ?? null) : null}
      />

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
            {play.isComplete ? (
              <View
                accessible
                accessibilityLabel={`${play.stars} / ${MAX_STARS}`}
                style={styles.stars}
              >
                {Array.from({ length: MAX_STARS }, (_, index) => (
                  <StarIcon
                    key={index}
                    size={20}
                    color={index < play.stars ? colors.star : colors.starOff}
                  />
                ))}
                {isDaily && today?.stats && today.stats.todayRank > 0 && (
                  <Text style={styles.rank}>
                    {t(locale, "profile.todaysRank")} : {today.stats.todayRank}
                  </Text>
                )}
              </View>
            ) : (
              hint && <Text style={styles.hint}>{hint}</Text>
            )}
          </View>
          {play.isComplete ? (
            <PressableSurface
              onPress={() =>
                isDaily
                  ? router.back()
                  : router.replace({
                      pathname: "/game",
                      params: { level: String(config.level + 1), continent: config.continent },
                    })
              }
              accessibilityLabel={t(locale, isDaily ? "success.backToHome" : "success.nextLevel")}
              face={colors.ink}
              radius={12}
              height={MIN_TOUCH}
              style={styles.action}
            >
              <Text style={styles.actionLabelOnInk}>
                {t(locale, isDaily ? "success.backToHome" : "success.nextLevel")}
              </Text>
            </PressableSurface>
          ) : (
            <PressableSurface
              onPress={play.takeHint}
              accessibilityLabel={t(locale, "game.hint")}
              disabled={play.hintStep === 3}
              face={colors.surface}
              border={colors.line}
              radius={12}
              height={MIN_TOUCH}
              style={styles.action}
            >
              <Text style={styles.actionLabel}>{t(locale, "game.hint")}</Text>
            </PressableSurface>
          )}
        </View>

        {!play.isComplete && (
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={submit}
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
  // Tall enough for a status and a two-line hint, so the map above never resizes mid-level.
  statusText: { flexShrink: 1, gap: 2, minHeight: 64, justifyContent: "center" },
  status: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  hint: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  stars: { flexDirection: "row", alignItems: "center", gap: 2 },
  rank: { marginLeft: 8, fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  action: { paddingHorizontal: 18 },
  actionLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  actionLabelOnInk: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.surface },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    fontFamily: fonts.body,
    fontSize: 17,
    color: colors.ink,
  },
})
