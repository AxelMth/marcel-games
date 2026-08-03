import { describe, expect, it } from "vitest"
import { isAdDue, resolveInterstitial } from "./ad-cadence"
import { NUMBER_OF_LEVELS_BETWEEN_ADS } from "./ad-constants"

const N = NUMBER_OF_LEVELS_BETWEEN_ADS

/** Plays a session's worth of completions and reports when an ad was shown. */
function playSession(
  levels: Array<{ mode: "world" | "continent" | "daily"; level: number }>
) {
  let exemptionAvailable = true
  const shownAt: number[] = []

  for (const { mode, level } of levels) {
    const { show, consumesExemption } = resolveInterstitial({
      mode,
      level,
      exemptionAvailable,
    })
    if (consumesExemption) exemptionAvailable = false
    if (show) shownAt.push(level)
  }
  return { shownAt, exemptionAvailable }
}

describe("isAdDue", () => {
  it(`is due every ${N} completed levels`, () => {
    const due = []
    for (let level = 1; level <= 4 * N; level++) {
      if (isAdDue({ mode: "world", level })) due.push(level)
    }
    expect(due).toEqual([N, 2 * N, 3 * N, 4 * N])
  })

  it("applies the same cadence in continent mode", () => {
    expect(isAdDue({ mode: "continent", level: N })).toBe(true)
    expect(isAdDue({ mode: "continent", level: N + 1 })).toBe(false)
  })

  it("is never due in daily mode, which has no next level", () => {
    for (const level of [1, N, 2 * N]) {
      expect(isAdDue({ mode: "daily", level })).toBe(false)
    }
  })

  it("is never due on level 0", () => {
    expect(isAdDue({ mode: "world", level: 0 })).toBe(false)
  })
})

describe("resolveInterstitial", () => {
  it("absorbs the first due ad of the session", () => {
    const { show, consumesExemption } = resolveInterstitial({
      mode: "world",
      level: N,
      exemptionAvailable: true,
    })
    expect(show).toBe(false)
    expect(consumesExemption).toBe(true)
  })

  it("shows the ad once the exemption is spent", () => {
    const { show, consumesExemption } = resolveInterstitial({
      mode: "world",
      level: N,
      exemptionAvailable: false,
    })
    expect(show).toBe(true)
    expect(consumesExemption).toBe(false)
  })

  it("does not spend the exemption when no ad was due", () => {
    // Levels that are not a multiple of the cadence, and daily levels, must
    // leave the exemption intact for the moment it actually matters.
    for (const input of [
      { mode: "world" as const, level: N + 1 },
      { mode: "daily" as const, level: N },
    ]) {
      const { show, consumesExemption } = resolveInterstitial({
        ...input,
        exemptionAvailable: true,
      })
      expect(show).toBe(false)
      expect(consumesExemption).toBe(false)
    }
  })

  it("covers continent mode, which resumes at a level the same way", () => {
    const { show, consumesExemption } = resolveInterstitial({
      mode: "continent",
      level: N,
      exemptionAvailable: true,
    })
    expect(show).toBe(false)
    expect(consumesExemption).toBe(true)
  })

  describe("over a whole session", () => {
    it("skips the first due ad, then honours every later one", () => {
      const { shownAt } = playSession(
        Array.from({ length: 4 * N }, (_, i) => ({
          mode: "world" as const,
          level: i + 1,
        }))
      )
      // N is absorbed by the exemption; the rest are shown.
      expect(shownAt).toEqual([2 * N, 3 * N, 4 * N])
    })

    it("keeps the exemption through levels that never trigger an ad", () => {
      // A player who completes four non-multiple levels then reaches one has
      // not burned anything in the meantime.
      const { shownAt, exemptionAvailable } = playSession([
        { mode: "world", level: 1 },
        { mode: "world", level: 2 },
        { mode: "daily", level: N },
        { mode: "world", level: 3 },
      ])
      expect(shownAt).toEqual([])
      expect(exemptionAvailable).toBe(true)
    })

    it("grants the exemption once across modes, not once per mode", () => {
      const { shownAt } = playSession([
        { mode: "world", level: N },
        { mode: "continent", level: N },
      ])
      expect(shownAt).toEqual([N])
    })
  })
})
