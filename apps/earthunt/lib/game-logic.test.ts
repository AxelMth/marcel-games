import { COUNTRY_DIFFICULTY_ORDER } from "./country-difficulty"
import { afterEach, describe, expect, it, vi } from "vitest"
import { countries, getCountriesByContinent } from "./countries"
import {
  buildOfflineLevelParams,
  createGameConfig,
  getContinentLevelId,
  getDailyLevelId,
  getMissingCountries,
  getWorldLevelId,
  matchCountry,
  normalizeCountryName,
} from "./game-logic"

describe("normalizeCountryName", () => {
  it("folds diacritics instead of deleting the accented letter", () => {
    // The bug this pins: stripping before folding turned "Brésil" into "brsil",
    // so a French player typing "Bresil" never matched.
    expect(normalizeCountryName("Brésil")).toBe("bresil")
    expect(normalizeCountryName("Bresil")).toBe("bresil")
  })

  it.each([
    ["  France  ", "france"],
    ["ÉTATS-UNIS", "etats-unis"],
    ["Côte d'Ivoire", "cote divoire"],
    ["Åland", "aland"],
    ["Türkiye", "turkiye"],
  ])("normalises %j to %j", (input, expected) => {
    expect(normalizeCountryName(input)).toBe(expected)
  })

  it("keeps spaces and hyphens, which are meaningful in country names", () => {
    expect(normalizeCountryName("Guinée-Bissau")).toBe("guinee-bissau")
    expect(normalizeCountryName("New Zealand")).toBe("new zealand")
  })
})

describe("matchCountry", () => {
  it("matches the English name", () => {
    expect(matchCountry("Brazil", countries)?.code).toBe("BRA")
  })

  it("matches the French name", () => {
    expect(matchCountry("Brésil", countries)?.code).toBe("BRA")
  })

  it("matches an unaccented spelling of the French name", () => {
    expect(matchCountry("bresil", countries)?.code).toBe("BRA")
  })

  it("is case and whitespace insensitive", () => {
    expect(matchCountry("  fRaNcE  ", countries)?.code).toBe("FRA")
  })

  it("returns null for a non-country", () => {
    expect(matchCountry("Atlantis", countries)).toBeNull()
  })

  it("returns null for an empty guess", () => {
    expect(matchCountry("   ", countries)).toBeNull()
  })
})

describe("getMissingCountries", () => {
  it("is deterministic: the same level id always yields the same set", () => {
    const a = getMissingCountries("world-level-4", countries, 4)
    const b = getMissingCountries("world-level-4", countries, 4)
    expect(a.map((c) => c.code)).toEqual(b.map((c) => c.code))
  })

  it("yields different sets for different level ids", () => {
    const a = getMissingCountries("world-level-4", countries, 4)
    const b = getMissingCountries("world-level-40", countries, 40)
    expect(a.map((c) => c.code)).not.toEqual(b.map((c) => c.code))
  })

  /**
   * The difficulty curve, which is the point of the whole thing. Moving level
   * generation to the client dropped it: every level drew uniformly from all
   * 170 countries, so level 7 asked for seven of them, mostly obscure. These
   * pin the curve the server used to apply and players were actually getting.
   */
  it("asks for a single country through the first fifteen levels", () => {
    for (let level = 1; level <= 15; level++) {
      expect(getMissingCountries(`world-level-${level}`, countries, level)).toHaveLength(1)
    }
  })

  it("grows the ask slowly, never faster than the curve allows", () => {
    const bounds: [number, number, number][] = [
      [20, 1, 3],
      [40, 2, 4],
      [80, 2, 5],
      [200, 5, 10],
      [400, 8, 15],
    ]
    for (const [level, min, max] of bounds) {
      const size = getMissingCountries(`world-level-${level}`, countries, level).length
      expect(size).toBeGreaterThanOrEqual(min)
      expect(size).toBeLessThanOrEqual(max)
    }
  })

  it("keeps early levels among the countries everyone knows", () => {
    const wellKnown = new Set(COUNTRY_DIFFICULTY_ORDER.slice(0, 17))
    for (let level = 1; level <= 15; level++) {
      for (const country of getMissingCountries(`world-level-${level}`, countries, level)) {
        expect(wellKnown.has(country.code)).toBe(true)
      }
    }
  })

  it("reaches the obscure ones eventually", () => {
    const seen = new Set<string>()
    for (let level = 900; level <= 1000; level++) {
      for (const c of getMissingCountries(`world-level-${level}`, countries, level)) seen.add(c.code)
    }
    const tail = COUNTRY_DIFFICULTY_ORDER.slice(-40)
    expect(tail.some((code) => seen.has(code))).toBe(true)
  })

  // Antarctica is in the dataset and second by area, so it used to surface in
  // the very first levels of a game that asks for countries.
  it("never asks for Antarctica", () => {
    for (let level = 1; level <= 1200; level += 7) {
      const codes = getMissingCountries(`world-level-${level}`, countries, level).map((c) => c.code)
      expect(codes).not.toContain("ATA")
    }
  })

  it("never returns more countries than the pool holds", () => {
    const tiny = countries.slice(0, 2)
    expect(getMissingCountries("x", tiny, 300).length).toBeLessThanOrEqual(2)
  })

  it("returns no duplicates", () => {
    for (const level of [9, 40, 120, 300, 900]) {
      const result = getMissingCountries(`world-level-${level}`, countries, level)
      expect(new Set(result.map((c) => c.code)).size).toBe(result.length)
    }
  })

  it("only returns countries drawn from the pool", () => {
    const europe = getCountriesByContinent("EUROPE")
    const result = getMissingCountries("continent-EUROPE-level-1", europe, 1)
    for (const country of result) {
      expect(europe.some((c) => c.code === country.code)).toBe(true)
    }
  })

  // A small continent must still hand back what the level asked for.
  it("fills the ask even from the smallest continent", () => {
    const oceania = getCountriesByContinent("OCEANIA")
    for (const level of [1, 40, 200, 900]) {
      const result = getMissingCountries(`continent-OCEANIA-level-${level}`, oceania, level)
      expect(result.length).toBeGreaterThan(0)
      expect(result.length).toBeLessThanOrEqual(oceania.length)
    }
  })
})

describe("level ids", () => {
  it("builds a world id from the level number", () => {
    expect(getWorldLevelId(7)).toBe("world-level-7")
  })

  it("builds a continent id from continent and level", () => {
    expect(getContinentLevelId("EUROPE", 3)).toBe("continent-EUROPE-level-3")
  })

  it("builds a daily id from the UTC date", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-02T12:00:00Z"))
    expect(getDailyLevelId()).toBe("daily-2026-08-02")
  })

  it("pads single-digit months and days", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-05T12:00:00Z"))
    expect(getDailyLevelId()).toBe("daily-2026-01-05")
  })

  it("rolls over at midnight UTC", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-02T23:59:00Z"))
    expect(getDailyLevelId()).toBe("daily-2026-08-02")

    vi.setSystemTime(new Date("2026-08-03T00:01:00Z"))
    expect(getDailyLevelId()).toBe("daily-2026-08-03")
  })

  it("does not roll over at local midnight ahead of UTC", () => {
    // The server rotates the puzzle at midnight UTC. A player in Paris at
    // 00:30 local (22:30 UTC the previous day) is still on yesterday's
    // challenge, so the id must not have advanced — otherwise the hint keys
    // and the puzzle would belong to different days.
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-02T22:30:00Z"))
    expect(getDailyLevelId()).toBe("daily-2026-08-02")
  })

  it("does not lag behind at local evening west of UTC", () => {
    // New York at 20:00 local on 2 August is already 3 August in UTC, and the
    // server is already serving the new puzzle.
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-03T00:30:00Z"))
    expect(getDailyLevelId()).toBe("daily-2026-08-03")
  })

  afterEach(() => {
    vi.useRealTimers()
  })
})

describe("createGameConfig", () => {
  it("uses the whole world as the pool in world mode", () => {
    const config = createGameConfig("world", 1)
    expect(config.allCountries).toHaveLength(countries.length)
    expect(config.mode).toBe("world")
    expect(config.level).toBe(1)
  })

  it("restricts both the answers and the pool to the continent", () => {
    const config = createGameConfig("continent", 1, "EUROPE")
    const europe = getCountriesByContinent("EUROPE")
    expect(config.allCountries).toHaveLength(europe.length)
    expect(config.continent).toBe("EUROPE")
    for (const country of config.missingCountries) {
      expect(country.continent).toBe("EUROPE")
    }
  })

  it("ramps difficulty with the level, then plateaus", () => {
    const early = createGameConfig("world", 1).missingCountries.length
    const late = createGameConfig("world", 40).missingCountries.length
    expect(late).toBeGreaterThanOrEqual(early)
    // maxMissing is capped at 20 however high the level goes.
    expect(createGameConfig("world", 500).missingCountries.length).toBeLessThanOrEqual(20)
  })

  // This used to demand three countries minimum, on the premise that fewer
  // made a level trivial. It is the wrong premise: the game shipped with a
  // single country through the early levels, which is what makes it learnable.
  // What matters is that a level always has something to find.
  it("always has at least one country to find", () => {
    for (let level = 1; level <= 200; level++) {
      expect(createGameConfig("world", level).missingCountries.length).toBeGreaterThanOrEqual(1)
    }
  })

  it("keys the daily puzzle on the date, not on the level argument", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 2, 12, 0, 0))
    const a = createGameConfig("daily", 1)
    const b = createGameConfig("daily", 1)
    expect(a.missingCountries.map((c) => c.code)).toEqual(
      b.missingCountries.map((c) => c.code)
    )
    vi.useRealTimers()
  })

  it("gives every player the same daily puzzle on the same date", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 2, 8, 0, 0))
    const morning = createGameConfig("daily", 1).missingCountries.map((c) => c.code)
    vi.setSystemTime(new Date(2026, 7, 2, 22, 30, 0))
    const evening = createGameConfig("daily", 1).missingCountries.map((c) => c.code)
    expect(morning).toEqual(evening)
    vi.useRealTimers()
  })

  // The daily is always opened at "level 1", so reading the curve there would
  // hand out one easy country every day. Its difficulty comes from the date
  // instead, matching the 1-50 range the server draws for it.
  it("ignores the level argument for the daily and derives difficulty from the date", () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date(Date.UTC(2026, 7, 2, 12, 0, 0)))
      const asLevelOne = createGameConfig("daily", 1).missingCountries.map((c) => c.code)
      const asLevelNinetyNine = createGameConfig("daily", 99).missingCountries.map((c) => c.code)

      expect(asLevelNinetyNine).toEqual(asLevelOne)
    } finally {
      vi.useRealTimers()
    }
  })

  it("gives the daily more substance than a first world level", () => {
    const sizes: number[] = []
    vi.useFakeTimers()
    try {
      for (let day = 1; day <= 28; day++) {
        vi.setSystemTime(new Date(Date.UTC(2026, 7, day, 12, 0, 0)))
        sizes.push(createGameConfig("daily", 1).missingCountries.length)
      }
    } finally {
      vi.useRealTimers()
    }
    // Not every day needs to be big, but a month of one-country dailies would
    // mean the date-derived difficulty is not being applied at all.
    expect(Math.max(...sizes)).toBeGreaterThan(1)
  })
})

describe("buildOfflineLevelParams", () => {
  it("produces the exact shape setGameFromLevel expects", () => {
    const params = buildOfflineLevelParams("world", 3)
    expect(params.mode).toBe("world")
    expect(params.level).toBe(3)
    expect(Array.isArray(params.countryCodes)).toBe(true)
    expect(params.countryCodes.length).toBeGreaterThan(0)
    expect(params.allCountries.length).toBe(countries.length)
  })

  it("matches what createGameConfig would have generated", () => {
    const config = createGameConfig("world", 6)
    const params = buildOfflineLevelParams("world", 6)
    expect(params.countryCodes).toEqual(config.missingCountries.map((c) => c.code))
  })

  it("carries the continent through", () => {
    const params = buildOfflineLevelParams("continent", 2, "ASIA")
    expect(params.continent).toBe("ASIA")
    expect(params.allCountries).toHaveLength(getCountriesByContinent("ASIA").length)
  })

  it("returns codes that all resolve back to real countries", () => {
    const params = buildOfflineLevelParams("world", 5)
    for (const code of params.countryCodes) {
      expect(countries.some((c) => c.code === code)).toBe(true)
    }
  })
})
