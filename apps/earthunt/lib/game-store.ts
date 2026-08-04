import { create } from "zustand"
import type { Country, Continent, CountryLocale } from "./countries"
import { getCountriesByCodes, getCountryName } from "./countries"
import { createGameConfig, matchCountry, type GameConfig } from "./game-logic"
import { countPersistedHints, getPersistedHints } from "./hint-storage"

export type Screen = "home" | "continent-select" | "game" | "success" | "stats"

interface GuessResult {
  type: "correct" | "already-found" | "not-missing" | "invalid"
  message: string
  country?: Country
}

export type GameModeLocal = "world" | "continent" | "daily"

interface GameState {
  screen: Screen
  gameConfig: GameConfig | null
  foundCountries: Country[]
  attempts: number
  startTime: number | null
  elapsedTime: number
  lastGuessResult: GuessResult | null
  highlightedCountry: string | null
  hintsUsed: number
  worldLevel: number
  continentLevels: Record<string, number>

  // API state
  userId: string | null
  pendingNextLevel: number | null
  pendingNextCountryCodes: string[] | null
  isLoadingGame: boolean
  gameError: string | null
  progress: { worldLevel: number; continentLevels: Record<string, number>; dailyCompleted: boolean } | null
  setProgress: (progress: { worldLevel: number; continentLevels: Record<string, number>; dailyCompleted: boolean } | null) => void
  isLoadingProgress: boolean
  setLoadingProgress: (loading: boolean) => void

  // Ads: the session's single interstitial exemption (see resolveInterstitial).
  // Spent the first time an ad is actually due, never restored — going back to
  // the home screen must not re-arm it, which is exactly what the previous
  // re-armable flag allowed: one skipped ad per visit to World, not per session.
  adExemptionAvailable: boolean
  consumeAdExemption: () => void

  // Navigation
  goHome: () => void
  goToStats: () => void
  goToContinentSelect: () => void
  startWorldGame: () => void
  startContinentGame: (continent: Continent) => void
  startDailyGame: () => void
  nextLevel: () => void

  // API-driven game start (called after launch + loadLevel)
  setUserId: (userId: string | null) => void
  setGameFromLevel: (params: {
    mode: GameModeLocal
    level: number
    continent?: Continent
    countryCodes: string[]
    allCountries: Country[]
  }) => void
  setPendingNextLevel: (level: number, countryCodes: string[]) => void
  setLoadingGame: (loading: boolean) => void
  setGameError: (error: string | null) => void

  // Game actions
  submitGuess: (input: string, locale: CountryLocale) => GuessResult
  consumeHintFirstLetter: (locale: CountryLocale) => string | null
  consumeHintShowOnMap: () => string | null
  consumeHintFullName: (locale: CountryLocale) => string | null
  clearHighlight: () => void
  clearLastGuess: () => void
  tick: () => void
  startTimer: () => void
}

/**
 * The country a paid "show on map" hint should be lighting up, or null.
 *
 * Hints survive in localStorage but `highlightedCountry` is in-memory state, so
 * leaving a level and coming back showed the hint as spent while the map went
 * dark again — the player had paid for nothing. Recomputed whenever the first
 * missing country changes, which is on level start and after every find.
 */
function restoreHighlight(
  mode: string,
  level: number,
  continent: string,
  missing: { code: string }[],
  found: { code: string }[]
): string | null {
  const next = missing.find((c) => !found.some((f) => f.code === c.code))
  if (!next) return null
  return getPersistedHints(mode, level, continent, next.code)?.map ? next.code : null
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: "home",
  gameConfig: null,
  foundCountries: [],
  attempts: 0,
  startTime: null,
  elapsedTime: 0,
  lastGuessResult: null,
  highlightedCountry: null,
  hintsUsed: 0,
  worldLevel: 1,
  continentLevels: {},
  userId: null,
  pendingNextLevel: null,
  pendingNextCountryCodes: null,
  isLoadingGame: false,
  gameError: null,
  progress: null,
  setProgress: (progress) => set({ progress }),
  isLoadingProgress: false,
  setLoadingProgress: (loading) => set({ isLoadingProgress: loading }),
  adExemptionAvailable: true,

  consumeAdExemption: () => set({ adExemptionAvailable: false }),

  goHome: () =>
    set({
      screen: "home",
      gameConfig: null,
      lastGuessResult: null,
      gameError: null,
    }),

  goToStats: () => set({ screen: "stats" }),

  goToContinentSelect: () => set({ screen: "continent-select", lastGuessResult: null }),

  startWorldGame: () => {
    const state = get()
    const config = createGameConfig("world", state.worldLevel)
    set({
      screen: "game",
      gameConfig: config,
      foundCountries: [],
      attempts: 0,
      startTime: null,
      elapsedTime: 0,
      lastGuessResult: null,
      highlightedCountry: null,
      hintsUsed: 0,
    })
  },

  startContinentGame: (continent: Continent) => {
    const state = get()
    const level = state.continentLevels[continent] || 1
    const config = createGameConfig("continent", level, continent)
    set({
      screen: "game",
      gameConfig: config,
      foundCountries: [],
      attempts: 0,
      startTime: null,
      elapsedTime: 0,
      lastGuessResult: null,
      highlightedCountry: null,
      hintsUsed: 0,
    })
  },

  startDailyGame: () => {
    const config = createGameConfig("daily", 1)
    set({
      screen: "game",
      gameConfig: config,
      foundCountries: [],
      attempts: 0,
      startTime: null,
      elapsedTime: 0,
      lastGuessResult: null,
      highlightedCountry: null,
      hintsUsed: 0,
    })
  },

  nextLevel: () => {
    const state = get()
    if (!state.gameConfig) return

    const { pendingNextLevel, pendingNextCountryCodes } = state
    if (
      pendingNextLevel != null &&
      pendingNextCountryCodes != null &&
      pendingNextCountryCodes.length > 0
    ) {
      const missingCountries = getCountriesByCodes(pendingNextCountryCodes)
      const allCountries =
        state.gameConfig.mode === "continent" && state.gameConfig.continent
          ? state.gameConfig.allCountries
          : state.gameConfig.allCountries
      const mode = state.gameConfig.mode
      const continent = state.gameConfig.continent
      set({
        screen: "game",
        gameConfig: {
          mode,
          continent,
          level: pendingNextLevel,
          missingCountries,
          allCountries,
        },
        worldLevel: mode === "world" ? pendingNextLevel : state.worldLevel,
        continentLevels:
          mode === "continent" && continent
            ? { ...state.continentLevels, [continent]: pendingNextLevel }
            : state.continentLevels,
        foundCountries: [],
        attempts: 0,
        startTime: null,
        elapsedTime: 0,
        lastGuessResult: null,
        highlightedCountry: null,
        // Same reason as setGameFromLevel: a level the player already
        // part-played must keep counting the hints they paid for.
        hintsUsed: countPersistedHints(
          mode,
          pendingNextLevel,
          continent ?? "",
          pendingNextCountryCodes
        ),
        pendingNextLevel: null,
        pendingNextCountryCodes: null,
      })
      return
    }

    if (state.gameConfig.mode === "world") {
      const newLevel = state.worldLevel + 1
      const config = createGameConfig("world", newLevel)
      set({
        screen: "game",
        worldLevel: newLevel,
        gameConfig: config,
        foundCountries: [],
        attempts: 0,
        startTime: null,
        elapsedTime: 0,
        lastGuessResult: null,
        highlightedCountry: null,
        hintsUsed: countPersistedHints(
          "world",
          newLevel,
          "",
          config.missingCountries.map((c) => c.code)
        ),
      })
    } else if (state.gameConfig.mode === "continent" && state.gameConfig.continent) {
      const continent = state.gameConfig.continent
      const newLevel = (state.continentLevels[continent] || 1) + 1
      const config = createGameConfig("continent", newLevel, continent)
      set({
        screen: "game",
        continentLevels: { ...state.continentLevels, [continent]: newLevel },
        gameConfig: config,
        foundCountries: [],
        attempts: 0,
        startTime: null,
        elapsedTime: 0,
        lastGuessResult: null,
        highlightedCountry: null,
        hintsUsed: countPersistedHints(
          "continent",
          newLevel,
          continent,
          config.missingCountries.map((c) => c.code)
        ),
      })
    } else {
      set({ screen: "home" })
    }
  },

  setUserId: (userId) => set({ userId }),
  setGameFromLevel: ({ mode, level, continent, countryCodes, allCountries }) => {
    const missingCountries = getCountriesByCodes(countryCodes)
    set({
      screen: "game",
      gameConfig: {
        mode,
        continent,
        level,
        missingCountries,
        allCountries,
      },
      worldLevel: mode === "world" ? level : get().worldLevel,
      continentLevels:
        mode === "continent" && continent
          ? { ...get().continentLevels, [continent]: level }
          : get().continentLevels,
      foundCountries: [],
      attempts: 0,
      startTime: null,
      elapsedTime: 0,
      lastGuessResult: null,
      highlightedCountry: restoreHighlight(
        mode,
        level,
        continent ?? "",
        missingCountries,
        []
      ),
      // Hints outlive the app (localStorage) but this counter does not. Rebuild
      // it, or a resumed level is scored as if no hint had ever been taken —
      // three stars despite the help, and a false hintsUsed sent to the server.
      hintsUsed: countPersistedHints(mode, level, continent ?? "", countryCodes),
      gameError: null,
    })
  },
  setPendingNextLevel: (level, countryCodes) =>
    set({ pendingNextLevel: level, pendingNextCountryCodes: countryCodes }),
  setLoadingGame: (loading) => set({ isLoadingGame: loading }),
  setGameError: (error) => set({ gameError: error }),

  submitGuess: (input: string, locale: CountryLocale) => {
    const state = get()
    if (!state.gameConfig) return { type: "invalid", message: "No game in progress" }

    set({ attempts: state.attempts + 1 })

    const matched = matchCountry(input, state.gameConfig.allCountries)
    if (!matched) {
      const result: GuessResult = { type: "invalid", message: "Country not found" }
      set({ lastGuessResult: result })
      return result
    }

    const alreadyFound = state.foundCountries.some((c) => c.code === matched.code)
    if (alreadyFound) {
      const result: GuessResult = {
        type: "already-found",
        message: `${getCountryName(matched, locale)} already found!`,
        country: matched,
      }
      set({ lastGuessResult: result })
      return result
    }

    const isMissing = state.gameConfig.missingCountries.some(
      (c) => c.code === matched.code
    )
    if (!isMissing) {
      const result: GuessResult = {
        type: "not-missing",
        message: `${getCountryName(matched, locale)} is not missing`,
        country: matched,
      }
      set({ lastGuessResult: result })
      return result
    }

    const newFound = [...state.foundCountries, matched]
    const result: GuessResult = {
      type: "correct",
      message: `${getCountryName(matched, locale)} found!`,
      country: matched,
    }

    const allFound = newFound.length === state.gameConfig.missingCountries.length

    set({
      foundCountries: newFound,
      lastGuessResult: result,
      // Flash the country just found, then hand the highlight over to whichever
      // country the next paid hint belongs to — the hints always describe the
      // first one still missing, so the map has to follow.
      highlightedCountry: matched.code,
    })

    setTimeout(() => {
      const current = get()
      if (current.gameConfig !== state.gameConfig) return
      set({
        highlightedCountry: restoreHighlight(
          state.gameConfig!.mode,
          state.gameConfig!.level,
          state.gameConfig!.continent ?? "",
          state.gameConfig!.missingCountries,
          newFound
        ),
      })
    }, 1200)

    if (allFound) {
      setTimeout(() => {
        set({ screen: "success" })
      }, 1200)
    }

    return result
  },

  consumeHintFirstLetter: (locale: CountryLocale) => {
    const state = get()
    if (!state.gameConfig) return null
    const remaining = state.gameConfig.missingCountries.filter(
      (c) => !state.foundCountries.some((f) => f.code === c.code)
    )
    if (remaining.length === 0) return null
    set({ hintsUsed: state.hintsUsed + 1 })
    return getCountryName(remaining[0], locale)[0]
  },

  consumeHintShowOnMap: () => {
    const state = get()
    if (!state.gameConfig) return null
    const remaining = state.gameConfig.missingCountries.filter(
      (c) => !state.foundCountries.some((f) => f.code === c.code)
    )
    if (remaining.length === 0) return null
    set({
      hintsUsed: state.hintsUsed + 1,
      highlightedCountry: remaining[0].code,
    })
    setTimeout(() => {
      set({ highlightedCountry: null })
    }, 5000)
    return remaining[0].code
  },

  consumeHintFullName: (locale: CountryLocale) => {
    const state = get()
    if (!state.gameConfig) return null
    const remaining = state.gameConfig.missingCountries.filter(
      (c) => !state.foundCountries.some((f) => f.code === c.code)
    )
    if (remaining.length === 0) return null
    set({ hintsUsed: state.hintsUsed + 1 })
    return getCountryName(remaining[0], locale)
  },

  clearHighlight: () => set({ highlightedCountry: null }),
  clearLastGuess: () => set({ lastGuessResult: null }),
  // Called by the game screen once the map has settled. The clock is the
  // player's score, so it must not include however long the map took to load —
  // and gating only the display would make the timer jump the moment it
  // started, since tick recomputes from startTime rather than incrementing.
  startTimer: () => {
    if (get().startTime === null) set({ startTime: Date.now() })
  },

  tick: () => {
    const state = get()
    if (state.startTime && state.screen === "game") {
      set({ elapsedTime: Math.floor((Date.now() - state.startTime) / 1000) })
    }
  },
}))
