import { describe, expect, it } from "vitest"
import { getPersistedHints, setPersistedHint } from "./hint-storage"

const FRA = "FRA"

describe("hint storage", () => {
  it("returns null when nothing was ever stored", () => {
    expect(getPersistedHints("world", 1, "", FRA)).toBeNull()
  })

  it("round-trips a single hint", () => {
    setPersistedHint("world", 1, "", FRA, "letter", 'Starts with "F"')
    expect(getPersistedHints("world", 1, "", FRA)).toEqual({
      letter: 'Starts with "F"',
    })
  })

  it("accumulates the three hint types under one key", () => {
    setPersistedHint("world", 1, "", FRA, "letter", 'Starts with "F"')
    setPersistedHint("world", 1, "", FRA, "map", true)
    setPersistedHint("world", 1, "", FRA, "name", "France")

    expect(getPersistedHints("world", 1, "", FRA)).toEqual({
      letter: 'Starts with "F"',
      map: true,
      name: "France",
    })
  })

  it("overwrites a hint of the same type without losing the others", () => {
    setPersistedHint("world", 1, "", FRA, "letter", "old")
    setPersistedHint("world", 1, "", FRA, "map", true)
    setPersistedHint("world", 1, "", FRA, "letter", "new")

    expect(getPersistedHints("world", 1, "", FRA)).toEqual({
      letter: "new",
      map: true,
    })
  })

  describe("isolation", () => {
    it("keeps levels separate", () => {
      setPersistedHint("world", 1, "", FRA, "letter", "level one")
      expect(getPersistedHints("world", 2, "", FRA)).toBeNull()
    })

    it("keeps countries separate", () => {
      setPersistedHint("world", 1, "", FRA, "letter", "france")
      expect(getPersistedHints("world", 1, "", "ITA")).toBeNull()
    })

    it("keeps continents separate", () => {
      setPersistedHint("continent", 1, "EUROPE", "ITA", "letter", "europe")
      expect(getPersistedHints("continent", 1, "ASIA", "ITA")).toBeNull()
    })

    it("keeps modes separate", () => {
      setPersistedHint("world", 1, "", FRA, "letter", "world hint")
      expect(getPersistedHints("daily", 1, "", FRA)).toBeNull()
    })

    it("normalises an empty continent to the same slot as world", () => {
      // getStorageKey does `continent || "world"`, so these must collide.
      setPersistedHint("continent", 1, "", FRA, "letter", "empty continent")
      expect(getPersistedHints("continent", 1, "world", FRA)).toEqual({
        letter: "empty continent",
      })
    })
  })

  describe("persistence", () => {
    it("survives a reload, since it is plain localStorage", () => {
      setPersistedHint("world", 3, "", FRA, "name", "France")
      // A reload keeps localStorage but drops every module-level variable; the
      // module reads storage on each call, so a fresh read is the same check.
      expect(getPersistedHints("world", 3, "", FRA)).toEqual({ name: "France" })
      expect(window.localStorage.getItem("earthunt-hints-world-3-world-FRA")).toBe(
        JSON.stringify({ name: "France" })
      )
    })
  })

  describe("resilience", () => {
    it("returns null on corrupt JSON rather than throwing", () => {
      window.localStorage.setItem("earthunt-hints-world-1-world-FRA", "{not json")
      expect(getPersistedHints("world", 1, "", FRA)).toBeNull()
    })

    it("does not throw when localStorage rejects a write", () => {
      const original = window.localStorage.setItem
      window.localStorage.setItem = () => {
        throw new Error("QuotaExceededError")
      }
      expect(() =>
        setPersistedHint("world", 1, "", FRA, "letter", "x")
      ).not.toThrow()
      window.localStorage.setItem = original
    })
  })

  describe("known defect: the daily key carries no date", () => {
    // getDailyLevelId() changes every day but the hint key is always
    // `daily-1-world-{code}`, so a hint paid for yesterday silently unlocks
    // today's challenge whenever the same country comes up first.
    it("reuses yesterday's hint for today's daily challenge", () => {
      setPersistedHint("daily", 1, "", FRA, "name", "France")

      // A new day: same mode, same hardcoded level 1, same first missing country.
      const todaysHints = getPersistedHints("daily", 1, "", FRA)

      expect(todaysHints).toEqual({ name: "France" })
    })
  })
})
