import { describe, expect, it } from "vitest"
import { getStars } from "./stars"

/**
 * Shared with server/earthunt/internal/domain/stars_test.go — the two
 * implementations must agree for every row, because the success screen renders
 * the client value while the stats screen renders what the server stored.
 * Keep the two tables identical when adding cases.
 */
export const STAR_PARITY_CASES: Array<{
  attempts: number
  countryCount: number
  hintsUsed: number
  expected: number
}> = [
  // No attempts recorded — both sides short-circuit to 3.
  { attempts: 0, countryCount: 0, hintsUsed: 0, expected: 3 },
  { attempts: -1, countryCount: 5, hintsUsed: 9, expected: 3 },

  // Perfect and near-perfect runs.
  { attempts: 10, countryCount: 10, hintsUsed: 0, expected: 3 },
  { attempts: 10, countryCount: 9, hintsUsed: 0, expected: 3 },
  // Same accuracy but a hint was used — drops to 2.
  { attempts: 10, countryCount: 9, hintsUsed: 1, expected: 2 },

  // The 70 % band.
  { attempts: 10, countryCount: 7, hintsUsed: 0, expected: 2 },
  { attempts: 10, countryCount: 7, hintsUsed: 2, expected: 2 },
  { attempts: 10, countryCount: 7, hintsUsed: 3, expected: 1 },

  // Below 70 %.
  { attempts: 10, countryCount: 6, hintsUsed: 0, expected: 1 },
  { attempts: 20, countryCount: 5, hintsUsed: 0, expected: 1 },

  // Rounding boundary, and the case that caught a real client/server split:
  // true accuracy is 69.56 %. Rounding gives 70 -> 2 stars; integer truncation
  // (what the Go server used to do) gives 69 -> 1 star, so the success screen
  // and the stats screen disagreed. Reachable in a real game — 16 countries is
  // inside the 3..20 range the level generator produces.
  { attempts: 23, countryCount: 16, hintsUsed: 0, expected: 2 },
  // Same shape one band up: 89.47 % must NOT round to 90.
  { attempts: 19, countryCount: 17, hintsUsed: 0, expected: 2 },
]

describe("getStars", () => {
  it.each(STAR_PARITY_CASES)(
    "attempts=$attempts found=$countryCount hints=$hintsUsed -> $expected stars",
    ({ attempts, countryCount, hintsUsed, expected }) => {
      expect(getStars(attempts, countryCount, hintsUsed)).toBe(expected)
    }
  )

  it("never returns a value outside 1..3", () => {
    for (let attempts = 0; attempts <= 40; attempts++) {
      for (let found = 0; found <= 20; found++) {
        for (const hints of [0, 1, 2, 3, 10]) {
          const stars = getStars(attempts, found, hints)
          expect(stars).toBeGreaterThanOrEqual(1)
          expect(stars).toBeLessThanOrEqual(3)
        }
      }
    }
  })
})
