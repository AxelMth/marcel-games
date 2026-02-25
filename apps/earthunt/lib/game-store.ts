import { create } from "zustand"
import type { Country, Continent, CountryLocale } from "./countries"
import { getCountriesByCodes, getCountryName } from "./countries"
import { createGameConfig, matchCountry, type GameConfig } from "./game-logic"

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

  userId: string | null
  pendingNextLevel: number | null
  pendingNextCountryCodes: string[] | null
  isLoadingGame: boolean
  gameError: string | null
  progress: {
    worldLevel: number
    continentLevels: Record<string, number>
    dailyCompleted: boolean
  } | null
  setProgress: (p: GameState["progress"]) => void
  isLoadingProgress: boolean
  setLoadingProgress: (l: boolean) => void

  worldLevelWasFromApiLoad: boolean
  clearWorldLevelWasFromApiLoad: () => void

  goHome: () => void
  goToStats: () => void
  goToContinentSelect: () => void
  startWorldGame: () => void
  startContinentGame: (continent: Continent) => void
  startDailyGame: () => void
  nextLevel: () => void

  setUserId: (userId: string | null) => void
  setGameFromLevel: (p: {
    mode: GameModeLocal
    level: number
    continent?: Continent
    countryCodes: string[]
    allCountries: Country[]
  }) => void
  setPendingNextLevel: (level: number, codes: string[]) => void
  setLoadingGame: (l: boolean) => void
  setGameError: (e: string | null) => void

  submitGuess: (input: string, locale: CountryLocale) => GuessResult
  useHintFirstLetter: (locale: CountryLocale) => string | null
  useHintShowOnMap: () => string | null
  useHintFullName: (locale: CountryLocale) => string | null
  clearHighlight: () => void
  clearLastGuess: () => void
  tick: () => void
}

function freshGameSlice() {
  return {
    foundCountries: [] as Country[],
    attempts: 0,
    startTime: Date.now(),
    elapsedTime: 0,
    lastGuessResult: null as GuessResult | null,
    highlightedCountry: null as string | null,
    hintsUsed: 0,
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: "home",
  gameConfig: null,
  ...freshGameSlice(),
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
  worldLevelWasFromApiLoad: false,

  clearWorldLevelWasFromApiLoad: () => set({ worldLevelWasFromApiLoad: false }),

  goHome: () =>
    set({ screen: "home", gameConfig: null, lastGuessResult: null, gameError: null }),

  goToStats: () => set({ screen: "stats" }),

  goToContinentSelect: () =>
    set({ screen: "continent-select", lastGuessResult: null }),

  startWorldGame: () => {
    const { worldLevel } = get()
    set({
      screen: "game",
      gameConfig: createGameConfig("world", worldLevel),
      ...freshGameSlice(),
    })
  },

  startContinentGame: (continent) => {
    const lvl = get().continentLevels[continent] || 1
    set({
      screen: "game",
      gameConfig: createGameConfig("continent", lvl, continent),
      ...freshGameSlice(),
    })
  },

  startDailyGame: () =>
    set({
      screen: "game",
      gameConfig: createGameConfig("daily", 1),
      ...freshGameSlice(),
    }),

  nextLevel: () => {
    const s = get()
    if (!s.gameConfig) return

    const { pendingNextLevel, pendingNextCountryCodes, gameConfig } = s
    if (pendingNextLevel != null && pendingNextCountryCodes?.length) {
      const missingCountries = getCountriesByCodes(pendingNextCountryCodes)
      set({
        screen: "game",
        gameConfig: {
          mode: gameConfig.mode,
          continent: gameConfig.continent,
          level: pendingNextLevel,
          missingCountries,
          allCountries: gameConfig.allCountries,
        },
        worldLevel: gameConfig.mode === "world" ? pendingNextLevel : s.worldLevel,
        continentLevels:
          gameConfig.mode === "continent" && gameConfig.continent
            ? { ...s.continentLevels, [gameConfig.continent]: pendingNextLevel }
            : s.continentLevels,
        ...freshGameSlice(),
        pendingNextLevel: null,
        pendingNextCountryCodes: null,
      })
      return
    }

    if (gameConfig.mode === "world") {
      const nl = s.worldLevel + 1
      set({
        screen: "game",
        worldLevel: nl,
        gameConfig: createGameConfig("world", nl),
        ...freshGameSlice(),
      })
    } else if (gameConfig.mode === "continent" && gameConfig.continent) {
      const c = gameConfig.continent
      const nl = (s.continentLevels[c] || 1) + 1
      set({
        screen: "game",
        continentLevels: { ...s.continentLevels, [c]: nl },
        gameConfig: createGameConfig("continent", nl, c),
        ...freshGameSlice(),
      })
    } else {
      set({ screen: "home" })
    }
  },

  setUserId: (userId) => set({ userId }),

  setGameFromLevel: ({ mode, level, continent, countryCodes, allCountries }) => {
    set({
      screen: "game",
      gameConfig: {
        mode,
        continent,
        level,
        missingCountries: getCountriesByCodes(countryCodes),
        allCountries,
      },
      worldLevel: mode === "world" ? level : get().worldLevel,
      continentLevels:
        mode === "continent" && continent
          ? { ...get().continentLevels, [continent]: level }
          : get().continentLevels,
      ...freshGameSlice(),
      gameError: null,
      worldLevelWasFromApiLoad: mode === "world",
    })
  },

  setPendingNextLevel: (level, codes) =>
    set({ pendingNextLevel: level, pendingNextCountryCodes: codes }),
  setLoadingGame: (loading) => set({ isLoadingGame: loading }),
  setGameError: (error) => set({ gameError: error }),

  submitGuess: (input, locale) => {
    const s = get()
    if (!s.gameConfig)
      return { type: "invalid" as const, message: "No game in progress" }

    set({ attempts: s.attempts + 1 })
    const matched = matchCountry(input, s.gameConfig.allCountries)
    if (!matched) {
      const r = { type: "invalid" as const, message: "Country not found" }
      set({ lastGuessResult: r })
      return r
    }

    if (s.foundCountries.some((c) => c.code === matched.code)) {
      const r = {
        type: "already-found" as const,
        message: `${getCountryName(matched, locale)} already found!`,
        country: matched,
      }
      set({ lastGuessResult: r })
      return r
    }

    if (!s.gameConfig.missingCountries.some((c) => c.code === matched.code)) {
      const r = {
        type: "not-missing" as const,
        message: `${getCountryName(matched, locale)} is not missing`,
        country: matched,
      }
      set({ lastGuessResult: r })
      return r
    }

    const newFound = [...s.foundCountries, matched]
    const r = {
      type: "correct" as const,
      message: `${getCountryName(matched, locale)} found!`,
      country: matched,
    }

    set({
      foundCountries: newFound,
      lastGuessResult: r,
      highlightedCountry: matched.code,
    })

    if (newFound.length === s.gameConfig.missingCountries.length) {
      setTimeout(() => set({ screen: "success" }), 1200)
    }

    return r
  },

  useHintFirstLetter: (locale) => {
    const s = get()
    if (!s.gameConfig) return null
    const rem = s.gameConfig.missingCountries.filter(
      (c) => !s.foundCountries.some((f) => f.code === c.code)
    )
    if (!rem.length) return null
    set({ hintsUsed: s.hintsUsed + 1 })
    return getCountryName(rem[0], locale)[0]
  },

  useHintShowOnMap: () => {
    const s = get()
    if (!s.gameConfig) return null
    const rem = s.gameConfig.missingCountries.filter(
      (c) => !s.foundCountries.some((f) => f.code === c.code)
    )
    if (!rem.length) return null
    set({ hintsUsed: s.hintsUsed + 1, highlightedCountry: rem[0].code })
    setTimeout(() => set({ highlightedCountry: null }), 5000)
    return rem[0].code
  },

  useHintFullName: (locale) => {
    const s = get()
    if (!s.gameConfig) return null
    const rem = s.gameConfig.missingCountries.filter(
      (c) => !s.foundCountries.some((f) => f.code === c.code)
    )
    if (!rem.length) return null
    set({ hintsUsed: s.hintsUsed + 1 })
    return getCountryName(rem[0], locale)
  },

  clearHighlight: () => set({ highlightedCountry: null }),
  clearLastGuess: () => set({ lastGuessResult: null }),
  tick: () => {
    const s = get()
    if (s.startTime && s.screen === "game") {
      set({ elapsedTime: Math.floor((Date.now() - s.startTime) / 1000) })
    }
  },
}))
