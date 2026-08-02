import type { Page } from "@playwright/test"
import { mockApi, skipSplash, test, type Locale } from "./fixtures"

/**
 * Produces the App Store screenshots. Not a test — it asserts nothing; it drives
 * the app to each marketing screen and captures it at the required resolution.
 *
 * Run it on its own:
 *   pnpm screenshots
 *
 * Unlike the flow specs this does NOT stub Mapbox: the map has to be real for
 * the gameplay shot. That needs NEXT_PUBLIC_SCREENSHOT_MODE=1 at build time so
 * Mapbox keeps its WebGL buffer, otherwise the map captures blank.
 */

const NAMES = {
  fr: { FRA: "France", ITA: "Italie" },
  en: { FRA: "France", ITA: "Italy" },
} as const

const LABELS = {
  fr: {
    world: "Monde",
    continent: "Continent",
    settings: "Paramètres",
    enterCountryName: "Tape le nom d'un pays...",
  },
  en: {
    world: "World",
    continent: "Continent",
    settings: "Settings",
    enterCountryName: "Enter a country name...",
  },
} as const

function localeOf(projectName: string): Locale {
  return projectName.endsWith("-fr") ? "fr" : "en"
}

async function shoot(page: Page, locale: Locale, name: string) {
  await page.waitForTimeout(1200) // let animations settle
  await page.screenshot({
    // Device pixels, not CSS: 430x932 at dsf 3 gives the 1290x2796 the
    // App Store requires for 6.9".
    path: `store-assets/ios/6.9/${locale}/${name}.png`,
  })
}

test.describe("store screenshots", () => {
  test.skip(
    () => process.env.SCREENSHOTS !== "1",
    "Set SCREENSHOTS=1 to regenerate store assets"
  )

  test("captures every marketing screen", async ({ page }, testInfo) => {
    const locale = localeOf(testInfo.project.name)
    const l = LABELS[locale]
    const names = NAMES[locale]

    await skipSplash(page)
    await mockApi(page, {
      worldLevel: 14,
      continentLevels: { EUROPE: 6, ASIA: 4, AMERICAS: 3, AFRICA: 2, OCEANIA: 2 },
      levelCountryCodes: ["FRA", "ITA"],
    })

    // A fuller history than the flow specs need: a nearly-empty stats screen
    // makes poor marketing material. Registered after mockApi so it wins.
    await page.route("**/profile**", (route) =>
      route.fulfill({
        json: {
          gameHistory: [
            { level: 13, gameMode: "WORLD", continent: "WORLD", stars: 3, rank: 1 },
            { level: 12, gameMode: "WORLD", continent: "WORLD", stars: 3, rank: 2 },
            { level: 11, gameMode: "WORLD", continent: "WORLD", stars: 2, rank: 5 },
            { level: 10, gameMode: "WORLD", continent: "WORLD", stars: 3, rank: 3 },
            { level: 9, gameMode: "WORLD", continent: "WORLD", stars: 2, rank: 8 },
            { level: 8, gameMode: "WORLD", continent: "WORLD", stars: 3, rank: 1 },
          ],
          stats: { dailyLevelsCompleted: 27, lastLevelRank: 3, globalRank: 42 },
        },
      })
    )

    await page.goto("/")

    // 1 — mode carousel
    await shoot(page, locale, "01-modes")

    // 2 — continent picker
    await page.getByRole("heading", { name: l.continent, exact: true }).click()
    await shoot(page, locale, "02-continents")
    await page.goBack()

    // 3 — gameplay with a real map
    await page.goto("/")
    await page.getByRole("heading", { name: l.world, exact: true }).click()
    await page.waitForTimeout(3500) // Mapbox tiles
    await shoot(page, locale, "03-gameplay")

    // 4 — success screen, reached by actually finishing the level
    const input = page.getByPlaceholder(l.enterCountryName)
    for (const code of ["FRA", "ITA"] as const) {
      await input.fill(names[code])
      await input.press("Enter")
    }
    await page.waitForTimeout(2500)
    await shoot(page, locale, "04-success")

    // 5 — stats
    await page.goto("/")
    await page.getByRole("button", { name: l.settings }).click()
    await shoot(page, locale, "05-stats")
  })
})
