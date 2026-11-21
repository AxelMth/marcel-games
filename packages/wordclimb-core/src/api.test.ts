import { afterEach, describe, expect, it, vi } from "vitest"
import { createWordClimbApi, isLevelResult, type LevelResult } from "./api"

const result: LevelResult = {
  attempts: 4,
  timeSpent: 31,
  hintsUsed: 1,
  gameMode: "NORMAL",
  locale: "FR",
  beginWord: "CHAT",
  endWord: "CHEF",
  wordLadder: ["CHAS"],
}

function answer(body: unknown, status = 200) {
  return vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(body), { status }))
}

afterEach(() => vi.unstubAllGlobals())

describe("isLevelResult", () => {
  it("accepts a finished level and refuses a damaged one", () => {
    expect(isLevelResult(result)).toBe(true)
    expect(isLevelResult({ ...result, wordLadder: [1] })).toBe(false)
    expect(isLevelResult({ ...result, gameMode: "CLASSIC" })).toBe(false)
    expect(isLevelResult({ ...result, attempts: -1 })).toBe(false)
  })
})

describe("createWordClimbApi", () => {
  const api = createWordClimbApi("https://api.test")

  it("counts the classic levels finished from the level about to be played", async () => {
    const fetch = answer({ worldLevel: 8 })
    vi.stubGlobal("fetch", fetch)
    await expect(api.classicLevelsFinished("a b")).resolves.toBe(7)
    expect(fetch.mock.calls[0]?.[0]).toBe("https://api.test/progress?userId=a%20b")
  })

  it("refuses a progress answer without a level", async () => {
    vi.stubGlobal("fetch", answer({ worldLevel: 0 }))
    await expect(api.classicLevelsFinished("u")).rejects.toThrow("no classic level")
  })

  it("sends a finished level under the player's id", async () => {
    const fetch = answer({ nextLevel: 2 })
    vi.stubGlobal("fetch", fetch)
    await api.finishLevel("u", result)
    expect(fetch.mock.calls[0]).toEqual([
      "https://api.test/level",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ userId: "u", ...result }) }),
    ])
  })

  it("turns an error status into an ApiHttpError", async () => {
    vi.stubGlobal("fetch", answer({ error: "Invalid request payload" }, 400))
    await expect(api.finishLevel("u", result)).rejects.toMatchObject({ status: 400 })
  })
})
