import {
  expect,
  makeApiUnreachable,
  mockApi,
  skipSplash,
  stubMapbox,
  test,
} from "./fixtures"

test.describe("arriving in the app", () => {
  test("shows the splash, then hands over to the mode carousel", async ({ page, t }) => {
    await stubMapbox(page)
    await mockApi(page)

    await page.goto("/")

    // The splash holds for a minimum time so the branding is actually seen.
    await expect(page.getByText("Marcel Games")).toBeVisible()

    await expect(page.getByText(t.scrollHint)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole("heading", { name: t.world, exact: true })).toBeVisible()
  })

  test("shows the splash only once per session", async ({ page, t }) => {
    await stubMapbox(page)
    await mockApi(page)

    await page.goto("/")
    await expect(page.getByText(t.scrollHint)).toBeVisible({ timeout: 20_000 })

    expect(await page.evaluate(() => sessionStorage.getItem("splash-done"))).toBe("1")
  })

  test("reaches the carousel even when the API is unreachable", async ({ page, t }) => {
    // The rejection that started all this looked exactly like this: a reviewer
    // on a restricted network facing a screen that never resolves.
    await stubMapbox(page)
    await skipSplash(page)
    await makeApiUnreachable(page)

    await page.goto("/")

    await expect(page.getByText(t.scrollHint)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole("heading", { name: t.world, exact: true })).toBeVisible()
    await expect(page.getByText(t.loading)).toBeHidden()
  })

  test("offers the three game modes", async ({ app: page, t }) => {
    await page.goto("/")

    await expect(page.getByRole("heading", { name: t.world, exact: true })).toBeVisible()
    await expect(page.getByRole("heading", { name: t.continent, exact: true })).toBeVisible()
    await expect(page.getByRole("heading", { name: t.daily, exact: true })).toBeVisible()
  })

  test("shows the saved world level on the mode card", async ({ page, t }) => {
    await stubMapbox(page)
    await skipSplash(page)
    await mockApi(page, { worldLevel: 12 })

    await page.goto("/")

    await expect(page.getByText(`${t.level} 12`)).toBeVisible()
  })

  test("disables the daily card once today's challenge is done", async ({ page, t }) => {
    await stubMapbox(page)
    await skipSplash(page)
    await mockApi(page, { dailyCompleted: true })

    await page.goto("/")

    await expect(page.getByText(t.doneForToday)).toBeVisible()
  })
})
