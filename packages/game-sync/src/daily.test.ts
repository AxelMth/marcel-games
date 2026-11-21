import { describe, expect, it } from "vitest"
import { dailyDone, dailyFromServer, isDaily, parseDailyStats, utcDay, type Daily } from "./daily"

const isWord = (value: unknown): value is string => typeof value === "string"
const stats = { completed: 3, todayRank: 2, globalRank: 5 }

describe("utcDay", () => {
  it("names the UTC day, whatever the device's timezone", () => {
    expect(utcDay(new Date("2026-11-21T23:59:59Z"))).toBe("2026-11-21")
    expect(utcDay(new Date("2026-11-22T00:00:00Z"))).toBe("2026-11-22")
  })
})

describe("parseDailyStats", () => {
  it("reads the server's field names", () => {
    expect(parseDailyStats({ dailyLevelsCompleted: 3, lastLevelRank: 2, globalRank: 5 })).toEqual(stats)
  })

  it("answers null for anything else", () => {
    expect(parseDailyStats(undefined)).toBeNull()
    expect(parseDailyStats({ dailyLevelsCompleted: 3 })).toBeNull()
  })
})

describe("dailyFromServer", () => {
  it("takes the puzzle the server hands out", () => {
    expect(dailyFromServer(null, "2026-11-21", { puzzle: "a", stats })).toEqual({
      day: "2026-11-21",
      puzzle: "a",
      done: false,
      stats,
    })
  })

  it("reads an absent puzzle as a finished day", () => {
    expect(dailyFromServer<string>(null, "2026-11-21", { puzzle: null, stats }).done).toBe(true)
  })

  it("keeps a day finished on the device finished while the server still offers it", () => {
    const known = dailyDone<string>(null, "2026-11-21")
    expect(dailyFromServer(known, "2026-11-21", { puzzle: "a", stats }).done).toBe(true)
  })

  it("forgets yesterday", () => {
    const known = dailyDone<string>(null, "2026-11-20")
    expect(dailyFromServer(known, "2026-11-21", { puzzle: "a", stats }).done).toBe(false)
  })
})

describe("dailyDone", () => {
  it("keeps today's puzzle and stats", () => {
    const known: Daily<string> = { day: "2026-11-21", puzzle: "a", done: false, stats }
    expect(dailyDone(known, "2026-11-21")).toEqual({ ...known, done: true })
  })
})

describe("isDaily", () => {
  it("accepts a stored day and refuses a damaged one", () => {
    expect(isDaily({ day: "2026-11-21", puzzle: "a", done: false, stats: null }, isWord)).toBe(true)
    expect(isDaily({ day: "2026-11-21", puzzle: 4, done: false, stats: null }, isWord)).toBe(false)
    expect(isDaily({ day: "2026-11-21", puzzle: null, done: true, stats: { completed: 1 } }, isWord)).toBe(false)
  })
})
