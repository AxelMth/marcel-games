import { expect, makeApiUnreachable, mockApi, skipSplash, stubMapbox, test } from "./fixtures"

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
    await mockApi(page, { levelCountryCodes: ["FRA", "ITA", "ESP"] })

    await page.goto("/")
    await page.getByRole("heading", { name: t.world, exact: true }).click()

    await expect(page.getByText(/3/).first()).toBeVisible()
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
