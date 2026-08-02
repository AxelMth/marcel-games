import { describe, expect, it } from "vitest"
import { getProgressCache, setProgressCache } from "./progress-cache"

const CACHE_KEY = "earthunt-progress-cache"

const VALID = {
  worldLevel: 7,
  continentLevels: { EUROPE: 3, ASIA: 1 },
  dailyCompleted: true,
}

describe("progress cache", () => {
  it("returns null when nothing is cached", () => {
    expect(getProgressCache()).toBeNull()
  })

  it("round-trips a full progress object", () => {
    setProgressCache(VALID)
    expect(getProgressCache()).toEqual(VALID)
  })

  it("drops the stats field, which is not part of the cached shape", () => {
    setProgressCache({
      ...VALID,
      stats: { dailyLevelsCompleted: 4, lastLevelRank: 2, globalRank: 9 },
    })
    expect(getProgressCache()).toEqual(VALID)
  })

  it("defaults a missing continentLevels to an empty object", () => {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ worldLevel: 2, continentLevels: null, dailyCompleted: false })
    )
    // typeof null === "object", so this passes validation and is then defaulted.
    expect(getProgressCache()).toEqual({
      worldLevel: 2,
      continentLevels: {},
      dailyCompleted: false,
    })
  })

  describe("rejects malformed payloads", () => {
    it.each([
      ["worldLevel is a string", { worldLevel: "7", continentLevels: {}, dailyCompleted: false }],
      ["dailyCompleted is a number", { worldLevel: 7, continentLevels: {}, dailyCompleted: 1 }],
      ["continentLevels is a string", { worldLevel: 7, continentLevels: "x", dailyCompleted: false }],
      ["the object is empty", {}],
    ])("returns null when %s", (_label, payload) => {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
      expect(getProgressCache()).toBeNull()
    })

    it("returns null on corrupt JSON rather than throwing", () => {
      window.localStorage.setItem(CACHE_KEY, "{not json")
      expect(getProgressCache()).toBeNull()
    })
  })

  it("does not throw when localStorage rejects a write", () => {
    const original = window.localStorage.setItem
    window.localStorage.setItem = () => {
      throw new Error("QuotaExceededError")
    }
    expect(() => setProgressCache(VALID)).not.toThrow()
    window.localStorage.setItem = original
  })

  it("overwrites rather than merging, so a reset level really goes back down", () => {
    setProgressCache(VALID)
    setProgressCache({ worldLevel: 1, continentLevels: {}, dailyCompleted: false })
    expect(getProgressCache()).toEqual({
      worldLevel: 1,
      continentLevels: {},
      dailyCompleted: false,
    })
  })
})
