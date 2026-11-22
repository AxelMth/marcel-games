import { describe, expect, it } from "vitest"
import { isHistoryBase, parseProfile } from "./profile"

describe("parseProfile", () => {
  it("reads the stats and keeps the entries it understands", () => {
    const profile = parseProfile(
      {
        stats: { dailyLevelsCompleted: 12, lastLevelRank: 4, globalRank: 37 },
        gameHistory: [{ level: 3, gameMode: "NORMAL", stars: 2, rank: 9 }, { level: "x" }],
      },
      isHistoryBase
    )
    expect(profile.stats).toEqual({ dailyLevelsCompleted: 12, lastLevelRank: 4, globalRank: 37 })
    expect(profile.history).toEqual([{ level: 3, gameMode: "NORMAL", stars: 2, rank: 9 }])
  })

  it("answers an empty history when the server sends none", () => {
    const profile = parseProfile(
      { stats: { dailyLevelsCompleted: 0, lastLevelRank: 0, globalRank: 0 }, gameHistory: null },
      isHistoryBase
    )
    expect(profile.history).toEqual([])
  })

  it("rejects an answer without stats", () => {
    expect(() => parseProfile({ gameHistory: [] }, isHistoryBase)).toThrow()
  })
})
