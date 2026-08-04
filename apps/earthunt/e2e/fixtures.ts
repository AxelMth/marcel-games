import { test as base, type Page } from "@playwright/test"

import { countries, type Continent } from "../lib/countries"
import { buildOfflineLevelParams } from "../lib/game-logic"

export const USER_ID = "e2e-user"

export type Locale = "fr" | "en"

/**
 * The app picks its language from navigator.language alone (see
 * packages/lib/src/language.ts), so the Playwright project locale drives it.
 * Asserting in both languages is what catches a missing translation.
 */
export const STRINGS = {
  fr: {
    scrollHint: "Glisse pour choisir le mode",
    tourSkip: "Passer",
    tourNext: "Suivant",
    tourDone: "Compris !",
    tourFirstStep: "Choisis ta façon de jouer",
    tourReplay: "Revoir le tutoriel",
    world: "Monde",
    continent: "Continent",
    daily: "Défi du jour",
    continentScrollHint: "Glisse pour choisir le continent",
    level: "Niveau",
    loading: "Chargement...",
    doneForToday: "Terminé pour aujourd'hui",
    missingOne: "manquant",
    firstLetter: "Première lettre",
    showOnMap: "Voir sur la carte",
    fullName: "Nom complet",
    mapHintResult: "Regarde la carte - surligné en jaune !",
    globalRank: "Rang au défi du jour",
    bestRankInMode: "Meilleur rang dans ce mode",
    notRanked: "Pas encore classé",
    nextLevel: "Niveau suivant",
    backToHome: "Retour à l'accueil",
    back: "Retour",
    settings: "Paramètres",
    enterCountryName: "Tape le nom d'un pays...",
    worldLevel: (n: number) => `Monde - Niveau ${n}`,
    continentLevel: (c: string, n: number) => `${c} - Niv. ${n}`,
    europe: "Europe",
  },
  en: {
    scrollHint: "Scroll to select game mode",
    tourSkip: "Skip",
    tourNext: "Next",
    tourDone: "Got it!",
    tourFirstStep: "Pick how you want to play",
    tourReplay: "Replay the tutorial",
    world: "World",
    continent: "Continent",
    daily: "Daily Challenge",
    continentScrollHint: "Scroll to select continent",
    level: "Level",
    loading: "Loading...",
    doneForToday: "Done for today",
    missingOne: "missing",
    firstLetter: "First Letter",
    showOnMap: "Show on Map",
    fullName: "Full Name",
    mapHintResult: "Check the map - highlighted in yellow!",
    globalRank: "Daily challenge rank",
    bestRankInMode: "Best rank in this mode",
    notRanked: "Not ranked yet",
    nextLevel: "Next Level",
    backToHome: "Back to Home",
    back: "Back",
    settings: "Settings",
    enterCountryName: "Enter a country name...",
    worldLevel: (n: number) => `World - Level ${n}`,
    continentLevel: (c: string, n: number) => `${c} - Lvl ${n}`,
    europe: "Europe",
  },
} as const satisfies Record<Locale, Record<string, unknown>>

export interface ApiState {
  worldLevel: number
  continentLevels: Record<string, number>
  dailyCompleted: boolean
  /**
   * Codes GET /level hands out. Only the daily challenge reads them now: World
   * and Continent boards come from the client generator, keyed on the level.
   */
  levelCountryCodes: string[]
  /** Codes POST /level returns for the level after this one. */
  nextCountryCodes: string[]
}

export const DEFAULT_STATE: ApiState = {
  worldLevel: 1,
  continentLevels: {},
  dailyCompleted: false,
  levelCountryCodes: ["FRA", "ITA", "ESP"],
  nextCountryCodes: ["DEU", "PRT", "GRC"],
}

/**
 * The board a World or Continent level actually shows.
 *
 * The API used to choose the countries, and drew them anew on every request, so
 * the mock had to pin them for a test to assert anything. The client is now the
 * only generator — seeded from the level id, hence stable — and the API only
 * says which level the player is on. Deriving the expectation from the same
 * generator the app uses keeps these assertions honest rather than restating a
 * mock back to itself.
 */
export function boardFor(
  mode: "world" | "continent" | "daily",
  level: number,
  continent?: Continent
): string[] {
  return buildOfflineLevelParams(mode, level, continent).countryCodes
}

/** Every country of a level, named in the running locale, in board order. */
export function boardNames(
  locale: Locale,
  mode: "world" | "continent" | "daily",
  level: number,
  continent?: Continent
): string[] {
  return boardFor(mode, level, continent).map((code) => {
    const country = countries.find((c) => c.code === code)!
    return locale === "fr" ? country.nameFr : country.nameEn
  })
}

/** Name of the country the hints describe: the first one still missing. */
export function firstMissingName(
  locale: Locale,
  mode: "world" | "continent" | "daily",
  level: number,
  continent?: Continent
): string {
  const [code] = boardFor(mode, level, continent)
  const country = countries.find((c) => c.code === code)!
  return locale === "fr" ? country.nameFr : country.nameEn
}

/**
 * Stubs the whole backend so a run is hermetic.
 */
export async function mockApi(page: Page, overrides: Partial<ApiState> = {}) {
  const state: ApiState = { ...DEFAULT_STATE, ...overrides }

  await page.route("**/launch", (route) =>
    route.fulfill({ json: { userId: USER_ID } })
  )

  await page.route("**/progress**", (route) =>
    route.fulfill({
      json: {
        worldLevel: state.worldLevel,
        continentLevels: state.continentLevels,
        dailyCompleted: state.dailyCompleted,
      },
    })
  )

  await page.route("**/profile**", (route) =>
    route.fulfill({
      json: {
        gameHistory: [
          { level: 3, gameMode: "WORLD", continent: "WORLD", stars: 3, rank: 1 },
          { level: 2, gameMode: "CONTINENTS", continent: "EUROPE", stars: 2, rank: 4 },
          { level: 1, gameMode: "LEVEL_OF_THE_DAY", continent: "WORLD", stars: 1, rank: 12 },
        ],
        stats: { dailyLevelsCompleted: 5, lastLevelRank: 2, globalRank: 42 },
      },
    })
  )

  await page.route("**/level**", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        json: {
          nextLevel: state.worldLevel + 1,
          nextCountryCodes: state.nextCountryCodes,
        },
      })
    }
    return route.fulfill({
      json: { level: state.worldLevel, countryCodes: state.levelCountryCodes },
    })
  })

  return state
}

/** Makes every API call fail, the way a restricted network or a cold server does. */
export async function makeApiUnreachable(page: Page) {
  await page.route("**/earthunt-api.fly.dev/**", (route) => route.abort("failed"))
}

/**
 * Mapbox needs WebGL and the network; neither affects a flow assertion, and
 * letting it through makes runs slow and non-hermetic.
 */
export async function stubMapbox(page: Page) {
  await page.route("**/api.mapbox.com/**", (route) => route.abort())
  await page.route("**/events.mapbox.com/**", (route) => route.abort())
  await page.route("**/*.mapbox.com/**", (route) => route.abort())
}

/** Skips the 2.5 s splash, which only needs to be exercised in its own spec. */
export async function skipSplash(page: Page) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("splash-done", "1")
  })
}

/**
 * Marks both guided tours as already seen.
 *
 * The tour is a modal overlay on a first visit, so leaving it armed makes every
 * other spec fight it for clicks. Applied automatically by the `test` fixture;
 * the tour's own spec calls `armTours` to get it back.
 */
export async function skipTours(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("earthunt-tour-home-v1", "1")
    window.localStorage.setItem("earthunt-tour-game-v1", "1")
  })
}

/**
 * Undoes {@link skipTours} so a tour runs, for the spec that tests it.
 *
 * Only on the first load of the tab. An init script runs again on every
 * navigation, so re-arming unconditionally would resurrect the tour after a
 * reload — and "it does not come back" is exactly what the spec checks.
 * sessionStorage survives the reload, which is what makes the once-only work.
 */
export async function armTours(page: Page) {
  await page.addInitScript(() => {
    if (window.sessionStorage.getItem("e2e-tours-armed")) return
    window.sessionStorage.setItem("e2e-tours-armed", "1")
    window.localStorage.removeItem("earthunt-tour-home-v1")
    window.localStorage.removeItem("earthunt-tour-game-v1")
  })
}

interface Fixtures {
  /** Silences the guided tours; see skipTours. */
  suppressTours: void
  /** Mapbox stubbed, API mocked with defaults, splash skipped. */
  app: Page
  /** Strings for the locale of the running project. */
  t: (typeof STRINGS)[Locale]
  /** The locale itself, for helpers that need to pick a country name. */
  locale: Locale
}

export const test = base.extend<Fixtures>({
  // Auto-fixture: runs for every test, tour spec included, which then re-arms
  // the tours explicitly.
  suppressTours: [
    async ({ page }, use) => {
      await skipTours(page)
      await use()
    },
    { auto: true },
  ],
  locale: async ({}, use, testInfo) => {
    await use(testInfo.project.name.endsWith("-fr") ? "fr" : "en")
  },
  t: async ({ locale }, use) => {
    await use(STRINGS[locale])
  },
  app: async ({ page }, use) => {
    await stubMapbox(page)
    await mockApi(page)
    await skipSplash(page)
    await use(page)
  },
})

export { expect } from "@playwright/test"
