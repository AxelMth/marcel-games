import { boardNames, expect, mockApi, skipSplash, stubMapbox, test } from "./fixtures"
import type { Page } from "@playwright/test"

async function guess(page: Page, name: string, placeholder: string) {
  const input = page.getByPlaceholder(placeholder)
  await input.fill(name)
  await input.press("Enter")
}

/**
 * Plays a level to completion.
 *
 * The countries come from the same seeded generator the app uses — the API no
 * longer picks them, so a hardcoded list would just be guessing at a board that
 * is not on screen.
 */
async function completeWorldLevel(
  page: Page,
  locale: "fr" | "en",
  level: number,
  placeholder: string
) {
  for (const name of boardNames(locale, "world", level)) {
    await guess(page, name, placeholder)
  }
}

test.describe("progress is saved and shown", () => {
  test("completing a level advances the mode card", async ({ page, t, locale }) => {
    await stubMapbox(page)
    await skipSplash(page)
    await mockApi(page, { worldLevel: 1 })

    await page.goto("/")
    await page.getByRole("heading", { name: t.world, exact: true }).click()
    await expect(page.getByText(t.worldLevel(1))).toBeVisible()

    await completeWorldLevel(page, locale, 1, t.enterCountryName)

    // The success screen appears after a short delay that lets the last answer land.
    await expect(page.getByRole("button", { name: t.nextLevel })).toBeVisible({
      timeout: 15_000,
    })
  })

  test("the new level survives going home", async ({ page, t, locale }) => {
    await stubMapbox(page)
    await skipSplash(page)
    await mockApi(page, { worldLevel: 1 })

    await page.goto("/")
    await page.getByRole("heading", { name: t.world, exact: true }).click()
    await completeWorldLevel(page, locale, 1, t.enterCountryName)
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
