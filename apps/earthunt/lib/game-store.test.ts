import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getCountriesByContinent } from "./countries"
import { buildOfflineLevelParams } from "./game-logic"
import { setPersistedHint } from "./hint-storage"
import { useGameStore } from "./game-store"

const store = () => useGameStore.getState()

/** Starts a real level through the same action the screens use. */
function startWorldLevel(level = 1) {
  store().setGameFromLevel(buildOfflineLevelParams("world", level))
  return store().gameConfig!
}

/**
 * Starts the first level that actually holds several countries.
 *
 * Early levels ask for a single country by design — that is the difficulty
 * curve — so a test about moving from one country to the next has to look
 * further up rather than hardcode a level number that the curve could move.
 */
function startMultiCountryLevel() {
  for (let level = 1; level <= 300; level++) {
    const config = startWorldLevel(level)
    if (config.missingCountries.length >= 2) return config
  }
  throw new Error("no level with two countries to find")
}

describe("game store", () => {
  describe("a paid hint outliving the level", () => {
    // Exactly the reported scenario: pay for "show on map", leave the level,
    // come back. The hint was remembered as spent but the map went dark, so the
    // player had paid for nothing.
    it("relights the country whose map hint was already paid for", () => {
      const config = startWorldLevel(4)
      const target = config.missingCountries[0].code
      setPersistedHint("world", 4, "", target, "map", true)

      startWorldLevel(4)

      expect(store().highlightedCountry).toBe(target)
    })

    it("leaves the map dark when no map hint was paid for", () => {
      const config = startWorldLevel(4)
      // A first-letter hint is free and must not light the map.
      setPersistedHint("world", 4, "", config.missingCountries[0].code, "letter", "A")

      startWorldLevel(4)

      expect(store().highlightedCountry).toBeNull()
    })

    it("does not leak a hint from one level into another", () => {
      const config = startWorldLevel(4)
      setPersistedHint("world", 4, "", config.missingCountries[0].code, "map", true)

      startWorldLevel(5)

      expect(store().highlightedCountry).toBeNull()
    })

    it("keys the hint per continent, so two continents do not share it", () => {
      const europe = getCountriesByContinent("EUROPE")
      store().setGameFromLevel(buildOfflineLevelParams("continent", 2, "EUROPE"))
      const target = store().gameConfig!.missingCountries[0].code
      setPersistedHint("continent", 2, "EUROPE", target, "map", true)

      store().setGameFromLevel(buildOfflineLevelParams("continent", 2, "ASIA"))

      expect(store().highlightedCountry).toBeNull()
      expect(europe.length).toBeGreaterThan(0)
    })
  })

  describe("the clock", () => {
    // The map can take seconds to appear, and the player's time is their score:
    // charging them for the load was the bug behind "the counter runs while
    // everything is still loading".
    it("stays at zero until the board is ready", () => {
      startWorldLevel()
      expect(store().startTime).toBeNull()

      store().tick()
      store().tick()

      expect(store().elapsedTime).toBe(0)
    })

    it("counts from the moment the board is ready, not from the level opening", () => {
      vi.useFakeTimers()
      try {
        vi.setSystemTime(new Date("2026-08-04T09:00:00Z"))
        startWorldLevel()

        // Five seconds of map loading, which must cost the player nothing.
        vi.advanceTimersByTime(5000)
        store().startTimer()

        vi.advanceTimersByTime(3000)
        store().tick()

        expect(store().elapsedTime).toBe(3)
      } finally {
        vi.useRealTimers()
      }
    })

    it("ignores a second start, so a re-settled map cannot rewind the clock", () => {
      vi.useFakeTimers()
      try {
        vi.setSystemTime(new Date("2026-08-04T09:00:00Z"))
        startWorldLevel()
        store().startTimer()
        const armedAt = store().startTime

        vi.advanceTimersByTime(4000)
        store().startTimer()

        expect(store().startTime).toBe(armedAt)
        store().tick()
        expect(store().elapsedTime).toBe(4)
      } finally {
        vi.useRealTimers()
      }
    })

    it("re-arms for the next level", () => {
      startWorldLevel(1)
      store().startTimer()
      expect(store().startTime).not.toBeNull()

      startWorldLevel(2)
      expect(store().startTime).toBeNull()
    })
  })

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

    // The highlight used to wipe itself after five seconds, while the rewarded
    // video that pays for it runs fifteen to thirty: the country lit up and
    // went dark again behind the ad, so the player came back to a blank map
    // having paid for nothing.
    it("keeps the country lit well past the length of a rewarded ad", () => {
      vi.useFakeTimers()
      try {
        startWorldLevel(1)
        const target = store().gameConfig!.missingCountries[0]

        expect(store().consumeHintShowOnMap()).toBe(target.code)
        expect(store().highlightedCountry).toBe(target.code)

        vi.advanceTimersByTime(60_000)
        expect(store().highlightedCountry).toBe(target.code)
      } finally {
        vi.useRealTimers()
      }
    })

    it("counts each hint, which is what costs the player stars", () => {
      store().consumeHintFirstLetter("en")
      store().consumeHintShowOnMap()
      store().consumeHintFullName("en")
      expect(store().hintsUsed).toBe(3)
    })

    it("advances to the next country once the current one is found", () => {
      const [first, second] = startMultiCountryLevel().missingCountries
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

    describe("resuming a level", () => {
      // The hints survive in localStorage but the store is memory-only. Without
      // rebuilding the counter, a player who quits mid-level and comes back is
      // scored as if they had used no hint at all.
      it("counts hints paid for in a previous session", () => {
        const params = buildOfflineLevelParams("world", 2)
        setPersistedHint("world", 2, "", params.countryCodes[0], "letter", "F")
        setPersistedHint("world", 2, "", params.countryCodes[0], "map", true)

        store().setGameFromLevel(params)

        expect(store().hintsUsed).toBe(2)
      })

      it("starts at zero when nothing was ever paid for", () => {
        store().setGameFromLevel(buildOfflineLevelParams("world", 2))
        expect(store().hintsUsed).toBe(0)
      })

      it("keeps counting on top of the restored total", () => {
        const params = buildOfflineLevelParams("world", 2)
        setPersistedHint("world", 2, "", params.countryCodes[0], "letter", "F")
        store().setGameFromLevel(params)

        store().consumeHintFullName("en")

        expect(store().hintsUsed).toBe(2)
      })

      it("does not import hints from a different level", () => {
        setPersistedHint("world", 9, "", "FRA", "letter", "F")
        store().setGameFromLevel(buildOfflineLevelParams("world", 2))
        expect(store().hintsUsed).toBe(0)
      })

      it("restores the count for a continent level too", () => {
        const params = buildOfflineLevelParams("continent", 3, "EUROPE")
        setPersistedHint(
          "continent",
          3,
          "EUROPE",
          params.countryCodes[0],
          "name",
          "Italie"
        )

        store().setGameFromLevel(params)

        expect(store().hintsUsed).toBe(1)
      })
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
