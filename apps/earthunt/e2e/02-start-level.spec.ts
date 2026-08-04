import { boardFor, expect, makeApiUnreachable, mockApi, skipSplash, stubMapbox, test } from "./fixtures"

test.describe("starting a level", () => {
  test("starts a world level from the carousel", async ({ app: page, t }) => {
    await page.goto("/")

    await page.getByRole("heading", { name: t.world, exact: true }).click()

    await expect(page.getByText(t.worldLevel(1))).toBeVisible()
    await expect(page.getByPlaceholder(t.enterCountryName)).toBeVisible()
  })

  test("shows how many countries are missing", async ({ page, t }) => {
    await stubMapbox(page)
    await skipSplash(page)
    await mockApi(page, { worldLevel: 1 })

    await page.goto("/")
    await page.getByRole("heading", { name: t.world, exact: true }).click()

    // The count comes from the generator, not from the mock: the API only says
    // which level the player is on.
    const expected = boardFor("world", 1).length
    await expect(page.getByText(new RegExp(`\\b${expected}\\b`)).first()).toBeVisible()
  })

  test("starts a continent level", async ({ app: page, t }) => {
    await page.goto("/")

    await page.getByRole("heading", { name: t.continent, exact: true }).click()
    await expect(page.getByText(t.continentScrollHint)).toBeVisible()

    await page.getByRole("heading", { name: t.europe, exact: true }).click()

    await expect(page.getByText(t.continentLevel(t.europe, 1))).toBeVisible()
    await expect(page.getByPlaceholder(t.enterCountryName)).toBeVisible()
  })

  test("starts the daily challenge", async ({ app: page, t }) => {
    await page.goto("/")

    await page.getByRole("heading", { name: t.daily, exact: true }).click()

    await expect(page.getByText(t.daily)).toBeVisible()
    await expect(page.getByPlaceholder(t.enterCountryName)).toBeVisible()
  })

  test("resumes a world level at the saved number", async ({ page, t }) => {
    await stubMapbox(page)
    await skipSplash(page)
    await mockApi(page, { worldLevel: 8 })

    await page.goto("/")
    await page.getByRole("heading", { name: t.world, exact: true }).click()

    await expect(page.getByText(t.worldLevel(8))).toBeVisible()
  })

  test("starts a level offline instead of blocking on an error", async ({ page, t }) => {
    // Without the offline fallback this showed an error and the player was stuck.
    await stubMapbox(page)
    await skipSplash(page)
    await makeApiUnreachable(page)

    await page.goto("/")
    await page.getByRole("heading", { name: t.world, exact: true }).click({ timeout: 30_000 })

    await expect(page.getByPlaceholder(t.enterCountryName)).toBeVisible({ timeout: 30_000 })
  })

  test("goes back to the carousel from a level", async ({ app: page, t }) => {
    await page.goto("/")
    await page.getByRole("heading", { name: t.world, exact: true }).click()
    await expect(page.getByPlaceholder(t.enterCountryName)).toBeVisible()

    await page.getByRole("button", { name: "Go back" }).click()

    await expect(page.getByText(t.scrollHint)).toBeVisible()
  })
})
