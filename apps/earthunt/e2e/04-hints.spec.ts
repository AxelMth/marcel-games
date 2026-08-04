import type { Page } from "@playwright/test"
import { expect, mockApi, skipSplash, stubMapbox, test, boardFor, firstMissingName } from "./fixtures"

/** Opens the hints sheet from inside a level. */
async function openHints(page: Page) {
  await page.getByRole("button", { name: "Hints and help" }).click()
  await page.getByRole("button", { name: "Get hints" }).click()
}

/**
 * Targets a hint by its title. Plain getByText is ambiguous here: the name of
 * each hint also appears inside the "use X first" copy of the locked ones.
 */
function hintButton(page: Page, title: string) {
  return page
    .getByRole("button")
    .filter({ has: page.getByText(title, { exact: true }) })
}

function hintKeys(page: Page) {
  return page.evaluate(() =>
    Object.keys(window.localStorage).filter((k) => k.startsWith("earthunt-hints-"))
  )
}

test.describe("hints", () => {
  test.beforeEach(async ({ page }) => {
    await stubMapbox(page)
    await skipSplash(page)
    await mockApi(page, { levelCountryCodes: ["FRA", "ITA", "ESP"] })
  })

  test("offers the three hints in world mode", async ({ page, t }) => {
    await page.goto("/")
    await page.getByRole("heading", { name: t.world, exact: true }).click()
    await openHints(page)

    await expect(hintButton(page, t.firstLetter)).toBeVisible()
    await expect(hintButton(page, t.showOnMap)).toBeVisible()
    await expect(hintButton(page, t.fullName)).toBeVisible()
  })

  test("reveals the first letter, which costs no ad", async ({ page, t, locale }) => {
    await page.goto("/")
    await page.getByRole("heading", { name: t.world, exact: true }).click()
    await openHints(page)

    await hintButton(page, t.firstLetter).click()

    // The first missing country of level 1 comes from the generator, so the
    // revealed letter is its initial.
    const initial = firstMissingName(locale, "world", 1)[0]
    await expect(page.getByText(new RegExp(initial, "i")).first()).toBeVisible()
    expect(await hintKeys(page)).toHaveLength(1)
  })

  test("unlocks the hints in order, each gated on the previous", async ({ page, t }) => {
    await page.goto("/")
    await page.getByRole("heading", { name: t.world, exact: true }).click()
    await openHints(page)

    await expect(hintButton(page, t.showOnMap)).toBeDisabled()
    await expect(hintButton(page, t.fullName)).toBeDisabled()

    await hintButton(page, t.firstLetter).click()

    await expect(hintButton(page, t.showOnMap)).toBeEnabled()
    // Still locked: it needs the map hint too.
    await expect(hintButton(page, t.fullName)).toBeDisabled()
  })

  test("saves a revealed hint across a reload", async ({ page, t }) => {
    await page.goto("/")
    await page.getByRole("heading", { name: t.world, exact: true }).click()
    await openHints(page)
    await hintButton(page, t.firstLetter).click()
    await expect(hintButton(page, t.showOnMap)).toBeEnabled()

    await page.reload()
    await page.getByRole("heading", { name: t.world, exact: true }).click()
    await openHints(page)

    // Already paid for, so it comes back unlocked instead of asking again.
    await expect(hintButton(page, t.showOnMap)).toBeEnabled()
  })

  test("keys hints per country, so the next country starts locked", async ({ page, t }) => {
    await page.goto("/")
    await page.getByRole("heading", { name: t.world, exact: true }).click()
    await openHints(page)
    await hintButton(page, t.firstLetter).click()
    await expect(hintButton(page, t.showOnMap)).toBeEnabled()

    // Keyed on the country the hint describes — the first one still missing —
    // and on nothing else on the board.
    const board = boardFor("world", 1)
    const keys = await hintKeys(page)
    expect(keys.some((k) => k.endsWith(board[0]))).toBe(true)
    for (const other of board.slice(1)) {
      expect(keys.some((k) => k.endsWith(other))).toBe(false)
    }
  })

  test("works in continent mode and stores under a continent key", async ({ page, t }) => {
    await page.goto("/")
    await page.getByRole("heading", { name: t.continent, exact: true }).click()
    await page.getByRole("heading", { name: t.europe, exact: true }).click()
    await openHints(page)

    await hintButton(page, t.firstLetter).click()
    await expect(hintButton(page, t.showOnMap)).toBeEnabled()

    const keys = await hintKeys(page)
    expect(keys.some((k) => k.startsWith("earthunt-hints-continent-"))).toBe(true)
  })

  test("works in the daily challenge", async ({ page, t }) => {
    await page.goto("/")
    await page.getByRole("heading", { name: t.daily, exact: true }).click()
    await openHints(page)

    await hintButton(page, t.firstLetter).click()
    await expect(hintButton(page, t.showOnMap)).toBeEnabled()

    const keys = await hintKeys(page)
    expect(keys.some((k) => k.startsWith("earthunt-hints-daily-"))).toBe(true)
  })
})
