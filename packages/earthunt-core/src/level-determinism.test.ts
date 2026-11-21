import { describe, it, expect } from "vitest"

import { buildOfflineLevelParams, createGameConfig } from "./game-logic"

/**
 * The bug this pins down: the server drew a level's countries from its global
 * random source on every request, so three identical calls answered USA, then
 * BRA, then CHN. The board changed under the player whenever a level was
 * re-fetched, and it took their paid hints with it — hints are filed under the
 * code of the country they describe.
 *
 * The client generator is now the only one for World and Continent, so this is
 * the property the whole fix rests on.
 */
describe("level determinism", () => {
  it("gives the same world level the same countries, every time", () => {
    for (const level of [1, 2, 7, 25, 100]) {
      const first = buildOfflineLevelParams("world", level).countryCodes
      const second = buildOfflineLevelParams("world", level).countryCodes

      expect(first).toEqual(second)
      expect(first.length).toBeGreaterThan(0)
    }
  })

  it("gives the same continent level the same countries, every time", () => {
    for (const continent of ["EUROPE", "ASIA", "AMERICAS", "AFRICA", "OCEANIA"] as const) {
      const first = buildOfflineLevelParams("continent", 3, continent).countryCodes
      const second = buildOfflineLevelParams("continent", 3, continent).countryCodes

      expect(first).toEqual(second)
      expect(first.length).toBeGreaterThan(0)
    }
  })

  it("still gives different levels different countries", () => {
    const seen = new Set<string>()
    for (let level = 1; level <= 20; level++) {
      seen.add(buildOfflineLevelParams("world", level).countryCodes.join(","))
    }

    // Not a strict guarantee that all twenty differ, but twenty identical draws
    // would mean the seed is not being used at all.
    expect(seen.size).toBeGreaterThan(10)
  })

  it("keeps continents apart at the same level", () => {
    const europe = buildOfflineLevelParams("continent", 5, "EUROPE").countryCodes
    const asia = buildOfflineLevelParams("continent", 5, "ASIA").countryCodes

    expect(europe).not.toEqual(asia)
  })

  // The path the screens actually take: the API supplies the level number, the
  // generator supplies the board. Both have to agree with a cold offline start.
  it("agrees with createGameConfig, so online and offline show one board", () => {
    const fromApi = buildOfflineLevelParams("world", 12).countryCodes
    const offline = createGameConfig("world", 12).missingCountries.map((c) => c.code)

    expect([...fromApi].sort()).toEqual([...offline].sort())
  })
})
