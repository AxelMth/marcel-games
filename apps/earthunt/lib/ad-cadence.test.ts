import { describe, expect, it } from "vitest"
import { shouldShowInterstitial } from "./ad-cadence"
import { NUMBER_OF_LEVELS_BETWEEN_ADS } from "./ad-constants"

const N = NUMBER_OF_LEVELS_BETWEEN_ADS

describe("shouldShowInterstitial", () => {
  describe("cadence", () => {
    it(`shows an ad every ${N} completed levels in world mode`, () => {
      const shown = []
      for (let level = 1; level <= 4 * N; level++) {
        if (
          shouldShowInterstitial({
            mode: "world",
            level,
            worldLevelWasFromApiLoad: false,
          })
        ) {
          shown.push(level)
        }
      }
      expect(shown).toEqual([N, 2 * N, 3 * N, 4 * N])
    })

    it("applies the same cadence in continent mode", () => {
      expect(
        shouldShowInterstitial({
          mode: "continent",
          level: N,
          worldLevelWasFromApiLoad: false,
        })
      ).toBe(true)
      expect(
        shouldShowInterstitial({
          mode: "continent",
          level: N + 1,
          worldLevelWasFromApiLoad: false,
        })
      ).toBe(false)
    })

    it("never shows an ad on level 0", () => {
      expect(
        shouldShowInterstitial({
          mode: "world",
          level: 0,
          worldLevelWasFromApiLoad: false,
        })
      ).toBe(false)
    })
  })

  describe("daily mode", () => {
    it("never shows an ad, even on a multiple of the cadence", () => {
      for (const level of [1, N, 2 * N]) {
        expect(
          shouldShowInterstitial({
            mode: "daily",
            level,
            worldLevelWasFromApiLoad: false,
          })
        ).toBe(false)
      }
    })
  })

  describe("first-world-level exemption", () => {
    // worldLevelWasFromApiLoad is set by setGameFromLevel for every world start,
    // online or offline. It exempts that first level from the cadence.
    it("skips the ad on the first world level of a session", () => {
      expect(
        shouldShowInterstitial({
          mode: "world",
          level: N,
          worldLevelWasFromApiLoad: true,
        })
      ).toBe(false)
    })

    it("does not exempt continent mode", () => {
      expect(
        shouldShowInterstitial({
          mode: "continent",
          level: N,
          worldLevelWasFromApiLoad: true,
        })
      ).toBe(true)
    })

    it("applies the normal cadence once the flag is cleared", () => {
      expect(
        shouldShowInterstitial({
          mode: "world",
          level: N,
          worldLevelWasFromApiLoad: false,
        })
      ).toBe(true)
    })
  })
})
