import { afterEach, describe, expect, it, vi } from "vitest"
import { createEartHuntApi, isLevelResult, type LevelResult } from "./api"

const result: LevelResult = {
  attempts: 3,
  timeSpent: 42,
  hintsUsed: 0,
  gameMode: "CONTINENTS",
  continent: "EUROPE",
  countryCodes: ["FR", "DE"],
}

afterEach(() => vi.unstubAllGlobals())

describe("isLevelResult", () => {
  it("accepts world and continent levels and refuses a damaged one", () => {
    expect(isLevelResult(result)).toBe(true)
    expect(isLevelResult({ ...result, gameMode: "WORLD", continent: "" })).toBe(true)
    expect(isLevelResult({ ...result, continent: "ATLANTIS" })).toBe(false)
    expect(isLevelResult({ ...result, countryCodes: "FR" })).toBe(false)
  })
})

describe("createEartHuntApi", () => {
  const api = createEartHuntApi("https://api.test")

  it("reads the level of each mode and ignores what is not a continent level", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ worldLevel: 4, continentLevels: { EUROPE: 3, ASIA: 0, MARS: 9 } })
          )
      )
    )
    await expect(api.progress("u")).resolves.toEqual({ world: 4, continents: { EUROPE: 3 } })
  })

  it("refuses a launch answer without a user id", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({}))))
    const device = {
      osName: "iOS",
      osVersion: "27.0",
      modelName: null,
      brand: "Apple",
      manufacturer: "Apple",
      deviceType: "PHONE" as const,
      isDevice: true,
    }
    await expect(api.launch("device", device)).rejects.toThrow("no user id")
  })
})
