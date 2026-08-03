import { describe, expect, it, vi } from "vitest"
import {
  countPersistedHints,
  getPersistedHints,
  setPersistedHint,
} from "./hint-storage"

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

  describe("countPersistedHints", () => {
    const LEVEL = ["FRA", "ITA", "ESP"]

    it("counts nothing when no hint was ever taken", () => {
      expect(countPersistedHints("world", 1, "", LEVEL)).toBe(0)
    })

    it("counts each hint type separately", () => {
      setPersistedHint("world", 1, "", FRA, "letter", "F")
      setPersistedHint("world", 1, "", FRA, "map", true)
      setPersistedHint("world", 1, "", FRA, "name", "France")
      expect(countPersistedHints("world", 1, "", LEVEL)).toBe(3)
    })

    it("sums across every country of the level, not just the first", () => {
      // A previous session may have been killed after buying hints on several
      // countries; hintsUsed is a per-level figure.
      setPersistedHint("world", 1, "", "FRA", "letter", "F")
      setPersistedHint("world", 1, "", "ITA", "letter", "I")
      setPersistedHint("world", 1, "", "ESP", "name", "Espagne")
      expect(countPersistedHints("world", 1, "", LEVEL)).toBe(3)
    })

    it("ignores countries that are not part of this level", () => {
      setPersistedHint("world", 1, "", "DEU", "letter", "D")
      expect(countPersistedHints("world", 1, "", LEVEL)).toBe(0)
    })

    it("ignores hints stored for another level", () => {
      setPersistedHint("world", 2, "", FRA, "letter", "F")
      expect(countPersistedHints("world", 1, "", LEVEL)).toBe(0)
    })

    it("does not count a stored false value", () => {
      window.localStorage.setItem(
        "earthunt-hints-world-1-world-FRA",
        JSON.stringify({ map: false })
      )
      expect(countPersistedHints("world", 1, "", LEVEL)).toBe(0)
    })

    it("survives a corrupt entry", () => {
      window.localStorage.setItem("earthunt-hints-world-1-world-ITA", "{not json")
      setPersistedHint("world", 1, "", FRA, "letter", "F")
      expect(countPersistedHints("world", 1, "", LEVEL)).toBe(1)
    })
  })

  describe("the daily challenge is scoped to its day", () => {
    // The daily level number is always 1, so without the date in the key a hint
    // paid for yesterday silently unlocks today's challenge whenever the same
    // country happens to come up first again.
    it("does not carry yesterday's hint into today", () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 7, 2, 12, 0, 0))
      setPersistedHint("daily", 1, "", FRA, "name", "France")
      expect(getPersistedHints("daily", 1, "", FRA)).toEqual({ name: "France" })

      vi.setSystemTime(new Date(2026, 7, 3, 12, 0, 0))
      expect(getPersistedHints("daily", 1, "", FRA)).toBeNull()

      vi.useRealTimers()
    })

    it("keeps a hint available for the rest of the same day", () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 7, 2, 8, 0, 0))
      setPersistedHint("daily", 1, "", FRA, "letter", 'Commence par "F"')

      vi.setSystemTime(new Date(2026, 7, 2, 23, 30, 0))
      expect(getPersistedHints("daily", 1, "", FRA)).toEqual({
        letter: 'Commence par "F"',
      })

      vi.useRealTimers()
    })

    it("leaves world and continent hints unaffected by the date", () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 7, 2, 12, 0, 0))
      setPersistedHint("world", 3, "", FRA, "name", "France")
      setPersistedHint("continent", 3, "EUROPE", "ITA", "name", "Italie")

      // A level you are part-way through must survive midnight.
      vi.setSystemTime(new Date(2026, 7, 5, 12, 0, 0))
      expect(getPersistedHints("world", 3, "", FRA)).toEqual({ name: "France" })
      expect(getPersistedHints("continent", 3, "EUROPE", "ITA")).toEqual({
        name: "Italie",
      })

      vi.useRealTimers()
    })
  })
})
