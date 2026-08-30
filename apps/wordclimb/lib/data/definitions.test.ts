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
/** Same word-identity rule as scripts/lib/word-key.mjs, restated on purpose. */
function strip(word: string) {
  return word.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
}

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
      it("never spells out the word it defines, accents included", () => {
        // Deliberately not the generator's own check. The first version of
        // both was `\b${word}\b`, which is ASCII-only and accent-blind, so the
        // test agreed with the bug: it read "pièce" in the definition of
        // "piece" as a different word and passed while the answer shipped.
        const leaking = Object.entries(DEFINITIONS[locale]).filter(
          ([word, definition]) =>
            (definition.match(/\p{L}+/gu) ?? []).some(
              (token) => strip(token) === strip(word)
            )
        )
        expect(leaking).toEqual([])
      })

      it("never blanks out a longer word it happens to sit inside", () => {
        // The mirror failure: masking "sent" turned "présent" into "pré•••",
        // because ASCII \b sees a boundary between "é" and "s".
        const mangled = Object.entries(DEFINITIONS[locale]).filter(
          ([, definition]) =>
            /\p{L}•••/u.test(definition) || /•••\p{L}/u.test(definition)
        )
        expect(mangled).toEqual([])
      })

      it("carries no leftover Wiktionary markup", () => {
        const dirty = Object.entries(DEFINITIONS[locale]).filter(
          ([, d]) =>
            d.includes("→ voir") ||
            /\^\(\[\d+\]\)/.test(d) ||
            /[:,;]$/.test(d) ||
            (d.split("(").length !== d.split(")").length)
        )
        expect(dirty).toEqual([])
      })

      it("has no empty definition", () => {
        const blank = Object.entries(DEFINITIONS[locale]).filter(
          ([, definition]) => definition.trim().length < 3
        )
        expect(blank).toEqual([])
      })

      it("covers every rung the catalogue can ask for", () => {
        // beginWord and endWord are on screen from the first frame, so they
        // are deliberately absent. A rung is a word the player has to type.
        const uncovered = rungsOf(locale)
          .filter((word) => !DEFINITIONS[locale][word])
          .sort()
        // Exact rather than a ratio, and empty rather than a named list: the
        // generator now requires a Wiktionary entry before a word may enter
        // the graph at all, so a rung with no definition means that filter
        // broke — the same hole "mlle" came through. A percentage loose
        // enough to hold one gap would sit quietly through twenty.
        expect(uncovered).toEqual([])
      })
    })
  }
})
