import { test as base, type Page } from "@playwright/test"

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
  /** Codes the next GET /level hands out. */
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
 * Stubs the whole backend so a run is hermetic. The real level generator draws
 * countries at random by design, which would make any assertion on a specific
 * country flaky.
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

interface Fixtures {
  /** Mapbox stubbed, API mocked with defaults, splash skipped. */
  app: Page
  /** Strings for the locale of the running project. */
  t: (typeof STRINGS)[Locale]
}

export const test = base.extend<Fixtures>({
  t: async ({}, use, testInfo) => {
    const locale: Locale = testInfo.project.name.endsWith("-fr") ? "fr" : "en"
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
