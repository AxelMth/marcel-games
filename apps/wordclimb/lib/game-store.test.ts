import { describe, expect, it } from "vitest"
import {
  createGameState,
  dailyLevelIndexFor,
  levelFromApi,
  toBackendGameMode,
  toBackendLocale,
  utcDateString,
} from "@/lib/game-store"

describe("toBackendGameMode", () => {
  it("maps the UI modes onto the server enum", () => {
    expect(toBackendGameMode("classic")).toBe("NORMAL")
    expect(toBackendGameMode("daily")).toBe("LEVEL_OF_THE_DAY")
  })
})

describe("toBackendLocale", () => {
  it("maps the app locales onto the server enum", () => {
    expect(toBackendLocale("en")).toBe("EN")
    expect(toBackendLocale("fr")).toBe("FR")
  })
})

describe("levelFromApi", () => {
  it("reads a level payload", () => {
    const level = levelFromApi({
      level: 12,
      beginWord: "cold",
      endWord: "warm",
      wordLadder: ["cord", "card", "ward"],
    })

    expect(level).toEqual({
      id: 12,
      beginWord: "cold",
      endWord: "warm",
      wordLadder: ["cord", "card", "ward"],
    })
  })

  // The server sends an empty payload for a daily that is already done, and for
  // a locale whose catalogue has not been populated. Either way there is
  // nothing to play, and the caller has to tell that apart from a real level.
  it("returns null for an empty payload", () => {
    expect(
      levelFromApi({ level: 1, beginWord: "", endWord: "", wordLadder: [] })
    ).toBeNull()
  })

  it("returns null when the ladder has no rung to find", () => {
    expect(
      levelFromApi({ level: 1, beginWord: "cold", endWord: "cord", wordLadder: [] })
    ).toBeNull()
  })
})

describe("the daily challenge day", () => {
  // These are the exact values pinned in the server's Go test
  // (pkg/utils/level_test.go, Test_DailyLevelIndexMatchesTheClientHash). Both
  // sides must agree, or an offline player plays a different daily from the one
  // the server ranks them against.
  it("hashes a date the same way the server does", () => {
    expect(dailyLevelIndexFor("2026-08-02", 15)).toBe(8)
    expect(dailyLevelIndexFor("2026-01-01", 15)).toBe(0)
    expect(dailyLevelIndexFor("2025-12-31", 15)).toBe(4)
    expect(dailyLevelIndexFor("2024-02-29", 15)).toBe(6)
  })

  it("never indexes past the catalogue", () => {
    for (const count of [1, 15, 1312, 1440]) {
      const index = dailyLevelIndexFor("2026-08-02", count)
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(count)
    }
  })

  it("survives an empty catalogue rather than returning NaN", () => {
    expect(dailyLevelIndexFor("2026-08-02", 0)).toBe(0)
  })

  // The server rolls the challenge over at midnight UTC. A device in a zone
  // ahead of UTC used to read its own local date and get tomorrow's puzzle.
  it("reads the UTC day, not the device's", () => {
    // 22:30 UTC on 2 August is already 3 August in Tokyo (UTC+9).
    expect(utcDateString(new Date("2026-08-02T22:30:00Z"))).toBe("2026-08-02")
    // 01:00 UTC on 3 August is still 2 August in Los Angeles (UTC-7).
    expect(utcDateString(new Date("2026-08-03T01:00:00Z"))).toBe("2026-08-03")
  })

  it("pads months and days to two digits", () => {
    expect(utcDateString(new Date("2026-01-05T12:00:00Z"))).toBe("2026-01-05")
  })
})

describe("createGameState", () => {
  const level = {
    id: 1,
    beginWord: "cold",
    endWord: "warm",
    wordLadder: ["cord", "card", "ward"],
  }

  it("starts with one unfound slot per word to find", () => {
    const state = createGameState("classic", level)

    expect(state.foundWords).toEqual([false, false, false])
    expect(state.currentWordIndex).toBe(0)
    expect(state.attempts).toBe(0)
    expect(state.hintsUsed).toBe(0)
    expect(state.isComplete).toBe(false)
  })

  it("plays the level it is handed rather than looking one up", () => {
    expect(createGameState("daily", level).level).toBe(level)
  })
})
