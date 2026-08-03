import { describe, expect, it } from "vitest"
import type { GameHistoryEntry } from "./api"
import { bestRankForMode, hasRank } from "./ranking"

function entry(over: Partial<GameHistoryEntry> = {}): GameHistoryEntry {
  return {
    level: 1,
    gameMode: "WORLD",
    continent: "WORLD",
    stars: 3,
    rank: 5,
    ...over,
  }
}

describe("hasRank", () => {
  // The server returns 0 when it has nothing to rank — a player who never
  // played that mode. Rendering that as "#0" reads like a real last place.
  it.each([
    [0, false],
    [-1, false],
    [1, true],
    [42, true],
  ])("rank %i -> %s", (rank, expected) => {
    expect(hasRank(rank)).toBe(expected)
  })
})

describe("bestRankForMode", () => {
  it("returns the player's best rank in the requested mode", () => {
    const history = [
      entry({ gameMode: "WORLD", rank: 7 }),
      entry({ gameMode: "WORLD", rank: 2 }),
      entry({ gameMode: "WORLD", rank: 9 }),
    ]
    expect(bestRankForMode(history, "WORLD")).toBe(2)
  })

  it("ignores the other modes", () => {
    // This is the defect it guards: the screen used to show one daily-only
    // number under all three tabs.
    const history = [
      entry({ gameMode: "WORLD", rank: 8 }),
      entry({ gameMode: "CONTINENTS", rank: 1 }),
      entry({ gameMode: "LEVEL_OF_THE_DAY", rank: 3 }),
    ]
    expect(bestRankForMode(history, "WORLD")).toBe(8)
    expect(bestRankForMode(history, "CONTINENTS")).toBe(1)
    expect(bestRankForMode(history, "LEVEL_OF_THE_DAY")).toBe(3)
  })

  it("returns null when the mode has never been played", () => {
    const history = [entry({ gameMode: "WORLD", rank: 3 })]
    expect(bestRankForMode(history, "CONTINENTS")).toBeNull()
  })

  it("returns null for an empty history", () => {
    expect(bestRankForMode([], "WORLD")).toBeNull()
  })

  it("skips unranked entries rather than reporting rank 0", () => {
    const history = [
      entry({ gameMode: "WORLD", rank: 0 }),
      entry({ gameMode: "WORLD", rank: 4 }),
    ]
    expect(bestRankForMode(history, "WORLD")).toBe(4)
  })

  it("returns null when every entry of the mode is unranked", () => {
    const history = [
      entry({ gameMode: "WORLD", rank: 0 }),
      entry({ gameMode: "WORLD", rank: 0 }),
    ]
    expect(bestRankForMode(history, "WORLD")).toBeNull()
  })
})
