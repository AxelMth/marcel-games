import { describe, expect, it } from "vitest"
import { CATALOGUE } from "@/lib/data/catalogue"
import { DEFINITIONS, getDefinition } from "@/lib/data/definitions"

/**
 * The definition is a paid hint, so the only thing it must never do is answer
 * the question it is asked. Two ways it can, and both are covered here:
 * spelling the word out inside its own text, and being looked up in the wrong
 * language — the two catalogues share 29 words out of 1415, so a French-only
 * word must not resolve through `lang: "en"` just because the key exists
 * somewhere.
 */
function rungsOf(locale: "en" | "fr") {
  const words = new Set<string>()
  for (const level of CATALOGUE[locale]) {
    for (const word of level.wordLadder) words.add(word.toLowerCase())
  }
  return [...words]
}

const FALLBACK = {
  en: "Find the next word in the ladder!",
  fr: "Trouve le prochain mot de l'echelle !",
} as const

describe("getDefinition", () => {
  it("returns the definition of a word it knows", () => {
    expect(getDefinition("card", "en")).toBe(DEFINITIONS.en.card)
    expect(getDefinition("porte", "fr")).toBe(DEFINITIONS.fr.porte)
  })

  it("is case-insensitive", () => {
    expect(getDefinition("CARD", "en")).toBe(getDefinition("card", "en"))
  })

  it("falls back for a word it does not know", () => {
    expect(getDefinition("zzzz", "en")).toBe(FALLBACK.en)
    expect(getDefinition("zzzz", "fr")).toBe(FALLBACK.fr)
  })

  it("does not leak a definition across locales", () => {
    const frenchOnly = rungsOf("fr").filter((word) => !DEFINITIONS.en[word])
    expect(frenchOnly.length).toBeGreaterThan(0)
    expect(getDefinition(frenchOnly[0], "en")).toBe(FALLBACK.en)
  })
})

describe("the shipped definitions", () => {
  for (const locale of ["en", "fr"] as const) {
    describe(locale, () => {
      it("never spells out the word it defines", () => {
        const leaking = Object.entries(DEFINITIONS[locale]).filter(
          ([word, definition]) =>
            new RegExp(`\\b${word}\\b`, "i").test(definition)
        )
        expect(leaking).toEqual([])
      })

      it("has no empty definition", () => {
        const blank = Object.entries(DEFINITIONS[locale]).filter(
          ([, definition]) => definition.trim().length < 3
        )
        expect(blank).toEqual([])
      })

      it("covers all but a handful of the rungs the catalogue can ask for", () => {
        // beginWord and endWord are on screen from the first frame, so they
        // are deliberately absent. A rung is a word the player has to type.
        const rungs = rungsOf(locale)
        const uncovered = rungs.filter((word) => !DEFINITIONS[locale][word])
        // The stragglers are catalogue oddities Wiktionary has no French
        // entry for — "mlle", and English words the French word list let
        // through. They fall back, which is the point of having a fallback.
        expect(uncovered.length / rungs.length).toBeLessThan(0.02)
      })
    })
  }
})
