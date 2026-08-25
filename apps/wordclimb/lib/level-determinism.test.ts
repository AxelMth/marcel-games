import { describe, expect, it } from "vitest"

import { dailyLevelIndexFor, getLevelForMode, setClassicProgress } from "@/lib/game-store"

/**
 * Every player must get the same puzzle.
 *
 * Earthunt already pins this in lib/level-determinism.test.ts, and for a
 * concrete reason: its server used to draw a level's countries from a global
 * random source on every request, so the board changed under the player
 * whenever a level was re-fetched — and took their hints with it, since hints
 * are filed against the board.
 *
 * WordClimb reaches the same property by a different route. There is no
 * generator: a level is an index into a catalogue both sides build from one run
 * of scripts/build-catalogue.mjs. Classic indexes on the player's progress, the
 * daily on the UTC date. Neither reads a clock beyond the date, nor any random
 * source — the one that existed belonged to the random mode, which is gone.
 *
 * These rows exist so that stays true. A `Math.random()` reintroduced anywhere
 * on this path fails here rather than in a player's hands.
 */
describe("les niveaux sont les mêmes pour tout le monde", () => {
  it("rend le même niveau classique pour une progression donnée", () => {
    setClassicProgress(7)
    const first = getLevelForMode("classic", "fr")
    const second = getLevelForMode("classic", "fr")
    const third = getLevelForMode("classic", "fr")

    expect(second).toEqual(first)
    expect(third).toEqual(first)
  })

  it("rend le même défi du jour à chaque appel", () => {
    const first = getLevelForMode("daily", "fr")
    const second = getLevelForMode("daily", "fr")

    expect(second).toEqual(first)
  })

  // Le point de la journée : deux joueurs, la même date, le même mot.
  it("dérive l'index du jour de la seule date", () => {
    expect(dailyLevelIndexFor("2026-08-25", 500)).toBe(
      dailyLevelIndexFor("2026-08-25", 500)
    )
  })

  it("change de puzzle d'un jour à l'autre", () => {
    const jour = dailyLevelIndexFor("2026-08-25", 500)
    const lendemain = dailyLevelIndexFor("2026-08-26", 500)

    expect(lendemain).not.toBe(jour)
  })

  // Les deux langues ont leur propre catalogue : une échelle française n'est pas
  // jouable en anglais, donc l'index ne suffit pas, la locale compte aussi.
  it("sépare les catalogues par langue", () => {
    setClassicProgress(3)
    const fr = getLevelForMode("classic", "fr")
    const en = getLevelForMode("classic", "en")

    expect(fr.beginWord).not.toBe(en.beginWord)
  })
})
