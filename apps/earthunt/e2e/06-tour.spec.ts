import { armTours, expect, mockApi, skipSplash, stubMapbox, test } from "./fixtures"

/**
 * How far the centre of the tour's cutout sits from the centre of the element
 * it claims to be pointing at.
 *
 * Both boxes are read in one evaluate: the tour follows its target on every
 * animation frame, so sampling them in two round trips compares two different
 * moments and fails for no reason.
 */
async function aimOffset(page: import("@playwright/test").Page, target: string) {
  return page.evaluate((selector) => {
    const hole = document.querySelector(
      '[role="dialog"][aria-modal="true"] mask rect:nth-of-type(2)'
    )
    const element = document.querySelector(`[data-tour="${selector}"]`)
    if (!hole || !element) return null

    const box = element.getBoundingClientRect()
    const holeX = Number(hole.getAttribute("x")) + Number(hole.getAttribute("width")) / 2
    const holeY = Number(hole.getAttribute("y")) + Number(hole.getAttribute("height")) / 2

    return {
      dx: Math.abs(holeX - (box.left + box.width / 2)),
      dy: Math.abs(holeY - (box.top + box.height / 2)),
    }
  }, target)
}

test.describe("guided tour", () => {
  test("spotlights the mode card on a first visit", async ({ page, t }) => {
    await stubMapbox(page)
    await skipSplash(page)
    await mockApi(page)
    await armTours(page)

    await page.goto("/")

    await expect(page.getByText(t.tourFirstStep)).toBeVisible({ timeout: 20_000 })

    // The whole point of a spotlight is that it lands on the element it is
    // talking about.
    await expect
      .poll(() => aimOffset(page, "mode-card"))
      .toEqual({ dx: expect.closeTo(0, 0), dy: expect.closeTo(0, 0) })
  })

  test("walks every step and then stops coming back", async ({ page, t }) => {
    await stubMapbox(page)
    await skipSplash(page)
    await mockApi(page)
    await armTours(page)

    await page.goto("/")
    await expect(page.getByText(t.tourFirstStep)).toBeVisible({ timeout: 20_000 })

    await page.getByRole("button", { name: t.tourNext, exact: true }).click()
    await page.getByRole("button", { name: t.tourNext, exact: true }).click()
    await page.getByRole("button", { name: t.tourDone, exact: true }).click()

    await expect(page.getByRole("dialog")).toBeHidden()

    await page.reload()
    await expect(page.getByText(t.scrollHint)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(t.tourFirstStep)).toBeHidden()
  })

  test("skipping counts as seen", async ({ page, t }) => {
    await stubMapbox(page)
    await skipSplash(page)
    await mockApi(page)
    await armTours(page)

    await page.goto("/")
    await expect(page.getByText(t.tourFirstStep)).toBeVisible({ timeout: 20_000 })
    await page.getByRole("button", { name: t.tourSkip, exact: true }).click()

    await page.reload()
    await expect(page.getByText(t.scrollHint)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(t.tourFirstStep)).toBeHidden()
  })

  // The tour must not point at a spinner, and the clock must not charge the
  // player for however long the map takes.
  test("holds the game tour and the clock until the board settles", async ({ page, t }) => {
    await stubMapbox(page)
    await skipSplash(page)
    await mockApi(page)
    await armTours(page)
    // Only the game tour is under test here; the home one would open first.
    await page.addInitScript(() => {
      localStorage.setItem("earthunt-tour-home-v1", "1")
    })

    await page.goto("/")
    await expect(page.getByText(t.scrollHint)).toBeVisible({ timeout: 20_000 })
    await page.getByRole("heading", { name: t.world, exact: true }).click()

    const indicator = page.locator('[data-tour="game-indicator"]')
    await expect(indicator).toBeVisible({ timeout: 20_000 })

    // Mapbox is blocked in these runs, so the map only settles on the give-up
    // timeout. Until then the clock has to read zero.
    await expect(indicator).toContainText("0:00")

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 20_000 })
    await expect
      .poll(() => aimOffset(page, "game-indicator"))
      .toEqual({ dx: expect.closeTo(0, 0), dy: expect.closeTo(0, 0) })
  })
})
