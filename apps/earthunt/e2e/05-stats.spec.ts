import { expect, mockApi, skipSplash, stubMapbox, test } from "./fixtures"

test.describe("stats", () => {
  test.beforeEach(async ({ page }) => {
    await stubMapbox(page)
    await skipSplash(page)
    await mockApi(page)
  })

  test("opens from the cog on the home screen", async ({ page, t }) => {
    await page.goto("/")

    await page.getByRole("button", { name: t.settings }).click()

    await expect(page.getByText(t.globalRank).first()).toBeVisible()
  })

  test("shows the global rank returned by the API", async ({ page, t }) => {
    await page.goto("/")
    await page.getByRole("button", { name: t.settings }).click()

    // The mocked profile reports rank 42.
    await expect(page.getByText("#42").first()).toBeVisible()
  })

  test("lists the game history", async ({ page, t }) => {
    await page.goto("/")
    await page.getByRole("button", { name: t.settings }).click()

    // World level 3 is the first row of the mocked history.
    await expect(page.getByText(`${t.level} 3`)).toBeVisible()
  })

  test("filters the history by mode", async ({ page, t }) => {
    await page.goto("/")
    await page.getByRole("button", { name: t.settings }).click()

    await expect(page.getByText(`${t.level} 3`)).toBeVisible()

    // Switching to Continent mode must swap the rows for the level 2 entry.
    await page.getByRole("radio").nth(1).click()
    await expect(page.getByText(`${t.level} 2`)).toBeVisible()
    await expect(page.getByText(`${t.level} 3`)).toBeHidden()
  })

  test("shows a per-mode rank that actually follows the selected mode", async ({
    page,
    t,
  }) => {
    // The card used to render stats.globalRank, a daily-only figure, under all
    // three tabs. The mocked history ranks World 1st and Continent 4th.
    await page.goto("/")
    await page.getByRole("button", { name: t.settings }).click()

    const card = page.locator("div").filter({ hasText: t.bestRankInMode }).last()
    // Rank 1 renders a medal, whose accessible name is the assertion target.
    await expect(card.getByLabel("1st place")).toBeVisible()

    await page.getByRole("radio").nth(1).click()
    await expect(card).toContainText("#4")
  })

  test("says so plainly when a mode has no ranking yet", async ({ page, t }) => {
    await stubMapbox(page)
    await skipSplash(page)
    // Server returns 0 when it has nothing to rank; "#0" reads as a real last place.
    await page.route("**/profile**", (route) =>
      route.fulfill({
        json: {
          gameHistory: [],
          stats: { dailyLevelsCompleted: 0, lastLevelRank: 0, globalRank: 0 },
        },
      })
    )

    await page.goto("/")
    await page.getByRole("button", { name: t.settings }).click()

    await expect(page.getByText(t.notRanked).first()).toBeVisible()
    await expect(page.getByText("#0")).toBeHidden()
  })

  test("comes back to the carousel", async ({ page, t }) => {
    await page.goto("/")
    await page.getByRole("button", { name: t.settings }).click()
    await expect(page.getByText(t.globalRank).first()).toBeVisible()

    await page.getByRole("button", { name: t.back }).click()

    await expect(page.getByText(t.scrollHint)).toBeVisible()
  })
})
