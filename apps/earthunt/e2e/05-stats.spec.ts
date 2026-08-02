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

  test("comes back to the carousel", async ({ page, t }) => {
    await page.goto("/")
    await page.getByRole("button", { name: t.settings }).click()
    await expect(page.getByText(t.globalRank).first()).toBeVisible()

    await page.getByRole("button", { name: t.back }).click()

    await expect(page.getByText(t.scrollHint)).toBeVisible()
  })
})
