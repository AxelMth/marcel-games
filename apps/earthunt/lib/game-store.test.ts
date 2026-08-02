import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getCountriesByContinent } from "./countries"
import { buildOfflineLevelParams } from "./game-logic"
import { useGameStore } from "./game-store"

const store = () => useGameStore.getState()

/** Starts a real level through the same action the screens use. */
function startWorldLevel(level = 1) {
  store().setGameFromLevel(buildOfflineLevelParams("world", level))
  return store().gameConfig!
}

describe("game store", () => {
  describe("setGameFromLevel", () => {
    it("enters the game screen with a fresh slate", () => {
      startWorldLevel(3)
      const s = store()
      expect(s.screen).toBe("game")
      expect(s.foundCountries).toEqual([])
      expect(s.attempts).toBe(0)
      expect(s.hintsUsed).toBe(0)
      expect(s.gameConfig?.level).toBe(3)
    })

    it("mirrors the level into worldLevel for world mode", () => {
      startWorldLevel(6)
      expect(store().worldLevel).toBe(6)
    })

    it("mirrors the level into continentLevels for continent mode", () => {
      store().setGameFromLevel(buildOfflineLevelParams("continent", 4, "EUROPE"))
      expect(store().continentLevels.EUROPE).toBe(4)
    })

    it("flags a world start as ad-exempt, and a continent start as not", () => {
      startWorldLevel(1)
      expect(store().worldLevelWasFromApiLoad).toBe(true)

      store().setGameFromLevel(buildOfflineLevelParams("continent", 1, "ASIA"))
      expect(store().worldLevelWasFromApiLoad).toBe(false)
    })

    it("restricts allCountries to the continent in continent mode", () => {
      store().setGameFromLevel(buildOfflineLevelParams("continent", 1, "OCEANIA"))
      expect(store().gameConfig?.allCountries).toHaveLength(
        getCountriesByContinent("OCEANIA").length
      )
    })
  })

  describe("submitGuess", () => {
    beforeEach(() => {
      startWorldLevel(1)
    })

    it("accepts a missing country and records it as found", () => {
      const target = store().gameConfig!.missingCountries[0]
      const result = store().submitGuess(target.nameEn, "en")

      expect(result.type).toBe("correct")
      expect(store().foundCountries.map((c) => c.code)).toContain(target.code)
      expect(store().highlightedCountry).toBe(target.code)
    })

    it("counts every guess as an attempt, valid or not", () => {
      store().submitGuess("Atlantis", "en")
      store().submitGuess("Narnia", "en")
      expect(store().attempts).toBe(2)
    })

    it("rejects a name that is not a country", () => {
      expect(store().submitGuess("Atlantis", "en").type).toBe("invalid")
      expect(store().foundCountries).toEqual([])
    })

    it("rejects a real country that is not part of this level", () => {
      const missing = new Set(
        store().gameConfig!.missingCountries.map((c) => c.code)
      )
      const notMissing = store().gameConfig!.allCountries.find(
        (c) => !missing.has(c.code)
      )!
      expect(store().submitGuess(notMissing.nameEn, "en").type).toBe("not-missing")
    })

    it("reports a repeat guess instead of counting it twice", () => {
      const target = store().gameConfig!.missingCountries[0]
      store().submitGuess(target.nameEn, "en")
      const second = store().submitGuess(target.nameEn, "en")

      expect(second.type).toBe("already-found")
      expect(store().foundCountries).toHaveLength(1)
    })

    it("accepts the French name when playing in French", () => {
      const target = store().gameConfig!.missingCountries[0]
      expect(store().submitGuess(target.nameFr, "fr").type).toBe("correct")
    })

    it("moves to the success screen once every country is found", () => {
      vi.useFakeTimers()
      startWorldLevel(1)
      for (const country of store().gameConfig!.missingCountries) {
        store().submitGuess(country.nameEn, "en")
      }

      // The transition is deliberately delayed so the last answer is visible.
      expect(store().screen).toBe("game")
      vi.advanceTimersByTime(1200)
      expect(store().screen).toBe("success")
    })
  })

  describe("hints", () => {
    beforeEach(() => {
      startWorldLevel(1)
    })

    it("reveals the first letter of the next unfound country", () => {
      const target = store().gameConfig!.missingCountries[0]
      expect(store().consumeHintFirstLetter("en")).toBe(target.nameEn[0])
    })

    it("reveals the full name of the next unfound country", () => {
      const target = store().gameConfig!.missingCountries[0]
      expect(store().consumeHintFullName("en")).toBe(target.nameEn)
    })

    it("localises the hint to the requested language", () => {
      const target = store().gameConfig!.missingCountries[0]
      expect(store().consumeHintFullName("fr")).toBe(target.nameFr)
    })

    it("highlights the country on the map, then clears it", () => {
      vi.useFakeTimers()
      startWorldLevel(1)
      const target = store().gameConfig!.missingCountries[0]

      expect(store().consumeHintShowOnMap()).toBe(target.code)
      expect(store().highlightedCountry).toBe(target.code)

      vi.advanceTimersByTime(5000)
      expect(store().highlightedCountry).toBeNull()
    })

    it("counts each hint, which is what costs the player stars", () => {
      store().consumeHintFirstLetter("en")
      store().consumeHintShowOnMap()
      store().consumeHintFullName("en")
      expect(store().hintsUsed).toBe(3)
    })

    it("advances to the next country once the current one is found", () => {
      const [first, second] = store().gameConfig!.missingCountries
      store().submitGuess(first.nameEn, "en")
      expect(store().consumeHintFullName("en")).toBe(second.nameEn)
    })

    it("returns null when there is nothing left to reveal", () => {
      for (const country of store().gameConfig!.missingCountries) {
        store().submitGuess(country.nameEn, "en")
      }
      expect(store().consumeHintFirstLetter("en")).toBeNull()
      expect(store().consumeHintFullName("en")).toBeNull()
      expect(store().consumeHintShowOnMap()).toBeNull()
    })

    it("returns null when no game is in progress", () => {
      store().goHome()
      expect(store().consumeHintFirstLetter("en")).toBeNull()
    })
  })

  describe("nextLevel", () => {
    it("uses the server's level when one was returned", () => {
      startWorldLevel(1)
      store().setPendingNextLevel(2, ["FRA", "ITA", "ESP"])
      store().nextLevel()

      const s = store()
      expect(s.gameConfig?.level).toBe(2)
      expect(s.gameConfig?.missingCountries.map((c) => c.code)).toEqual([
        "FRA",
        "ITA",
        "ESP",
      ])
      // Consumed, so the next call falls back to the local generator.
      expect(s.pendingNextLevel).toBeNull()
    })

    it("falls back to the local generator when the server gave nothing", () => {
      startWorldLevel(4)
      store().nextLevel()
      expect(store().gameConfig?.level).toBe(5)
      expect(store().worldLevel).toBe(5)
    })

    it("advances the selected continent only", () => {
      store().setGameFromLevel(buildOfflineLevelParams("continent", 2, "EUROPE"))
      store().nextLevel()
      expect(store().continentLevels.EUROPE).toBe(3)
      expect(store().continentLevels.ASIA).toBeUndefined()
    })

    it("sends the player home after the daily challenge, which has no next level", () => {
      store().setGameFromLevel(buildOfflineLevelParams("daily", 1))
      store().nextLevel()
      expect(store().screen).toBe("home")
    })

    it("resets the round counters", () => {
      startWorldLevel(1)
      store().submitGuess("Atlantis", "en")
      store().consumeHintFirstLetter("en")
      store().nextLevel()

      expect(store().attempts).toBe(0)
      expect(store().hintsUsed).toBe(0)
      expect(store().foundCountries).toEqual([])
    })
  })

  describe("navigation", () => {
    it("clears the game when going home", () => {
      startWorldLevel(1)
      store().goHome()
      expect(store().screen).toBe("home")
      expect(store().gameConfig).toBeNull()
    })

    it("keeps progress when going home, so the mode card still shows the level", () => {
      startWorldLevel(8)
      store().goHome()
      expect(store().worldLevel).toBe(8)
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })
})
