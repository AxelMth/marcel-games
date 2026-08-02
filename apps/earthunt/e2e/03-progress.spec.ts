import { expect, mockApi, skipSplash, stubMapbox, test, type Locale } from "./fixtures"
import type { Page } from "@playwright/test"

/** Country names as the app expects them, per locale. */
const NAMES = {
  fr: { FRA: "France", ITA: "Italie", ESP: "Espagne" },
  en: { FRA: "France", ITA: "Italy", ESP: "Spain" },
} as const

function namesFor(projectName: string) {
  const locale: Locale = projectName.endsWith("-fr") ? "fr" : "en"
  return NAMES[locale]
}

async function guess(page: Page, name: string, placeholder: string) {
  const input = page.getByPlaceholder(placeholder)
  await input.fill(name)
  await input.press("Enter")
}

test.describe("progress is saved and shown", () => {
  test("completing a level advances the mode card", async ({ page, t }, testInfo) => {
    const names = namesFor(testInfo.project.name)
    await stubMapbox(page)
    await skipSplash(page)
    await mockApi(page, { worldLevel: 1, levelCountryCodes: ["FRA", "ITA", "ESP"] })

    await page.goto("/")
    await page.getByRole("heading", { name: t.world, exact: true }).click()
    await expect(page.getByText(t.worldLevel(1))).toBeVisible()

    for (const code of ["FRA", "ITA", "ESP"] as const) {
      await guess(page, names[code], t.enterCountryName)
    }

    // The success screen appears after a short delay that lets the last answer land.
    await expect(page.getByRole("button", { name: t.nextLevel })).toBeVisible({
      timeout: 15_000,
    })
  })

  test("the new level survives going home", async ({ page, t }, testInfo) => {
    const names = namesFor(testInfo.project.name)
    await stubMapbox(page)
    await skipSplash(page)
    await mockApi(page, { worldLevel: 1, levelCountryCodes: ["FRA", "ITA", "ESP"] })

    await page.goto("/")
    await page.getByRole("heading", { name: t.world, exact: true }).click()
    for (const code of ["FRA", "ITA", "ESP"] as const) {
      await guess(page, names[code], t.enterCountryName)
    }
    await expect(page.getByRole("button", { name: t.nextLevel })).toBeVisible({
      timeout: 15_000,
    })

    // POST /level answered nextLevel = 2, so the card must now read level 2.
    await page.getByRole("button", { name: t.backToHome }).click()
    await expect(page.getByText(`${t.level} 2`)).toBeVisible()
  })

  test("progress is cached, so a reload does not lose it", async ({ page, t }) => {
    await stubMapbox(page)
    await skipSplash(page)
    await mockApi(page, { worldLevel: 9 })

    await page.goto("/")
    await expect(page.getByText(`${t.level} 9`)).toBeVisible()

    const cached = await page.evaluate(() =>
      window.localStorage.getItem("earthunt-progress-cache")
    )
    expect(cached).toContain('"worldLevel":9')
  })

  test("falls back to the cache when the API stops answering", async ({ page, t }) => {
    await stubMapbox(page)
    await skipSplash(page)
    await mockApi(page, { worldLevel: 9 })

    await page.goto("/")
    await expect(page.getByText(`${t.level} 9`)).toBeVisible()

    // Same browser context, so the cache persists; the API is now dead.
    await page.route("**/earthunt-api.fly.dev/**", (route) => route.abort("failed"))
    await page.reload()

    await expect(page.getByText(`${t.level} 9`)).toBeVisible({ timeout: 30_000 })
  })

  test("continent progress is tracked per continent", async ({ page, t }) => {
    await stubMapbox(page)
    await skipSplash(page)
    await mockApi(page, { continentLevels: { EUROPE: 5, ASIA: 2 } })

    await page.goto("/")
    await page.getByRole("heading", { name: t.continent, exact: true }).click()

    await expect(page.getByText(`${t.level} 5`)).toBeVisible()
  })

  test("shows the level inside the game, not just on the card", async ({ page, t }) => {
    await stubMapbox(page)
    await skipSplash(page)
    await mockApi(page, { worldLevel: 7 })

    await page.goto("/")
    await expect(page.getByText(`${t.level} 7`)).toBeVisible()

    await page.getByRole("heading", { name: t.world, exact: true }).click()
    await expect(page.getByText(t.worldLevel(7))).toBeVisible()
  })
})
