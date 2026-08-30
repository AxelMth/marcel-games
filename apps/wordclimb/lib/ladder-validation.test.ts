import { describe, expect, it } from "vitest"
import { CATALOGUE } from "./data/catalogue"
import {
  hammingDistance,
  isValidLevel,
  validateCatalogue,
  validateLevel,
} from "./ladder-validation"

describe("hammingDistance", () => {
  it.each([
    ["cold", "cord", 1],
    ["cold", "warm", 4],
    ["cold", "cold", 0],
  ])("%s to %s is %i", (a, b, expected) => {
    expect(hammingDistance(a, b)).toBe(expected)
  })

  it("returns null for words of different lengths", () => {
    expect(hammingDistance("fire", "fir")).toBeNull()
  })
})

describe("validateLevel", () => {
  const ok = { id: 1, beginWord: "cold", endWord: "warm", wordLadder: ["cord", "word", "ward"] }

  it("accepts a ladder where every step changes one letter", () => {
    expect(validateLevel(ok)).toEqual([])
    expect(isValidLevel(ok)).toBe(true)
  })

  it("rejects a step that changes two letters", () => {
    const level = { id: 2, beginWord: "four", endWord: "five", wordLadder: ["fore", "fire"] }
    expect(validateLevel(level)[0].reason).toContain("changes 2 letters")
  })

  it("rejects a rung of a different length", () => {
    // A short word renders a row with too few letter boxes.
    const level = { id: 3, beginWord: "hire", endWord: "fast", wordLadder: ["fire", "fir", "fist"] }
    expect(validateLevel(level).some((p) => p.reason.includes("same length"))).toBe(true)
  })

  it("rejects a repeated word", () => {
    const level = { id: 4, beginWord: "cake", endWord: "pine", wordLadder: ["pine", "pine"] }
    expect(validateLevel(level).some((p) => p.reason.includes("repeats"))).toBe(true)
  })

  it("accepts a ladder with a single rung", () => {
    expect(isValidLevel({ id: 5, beginWord: "cat", endWord: "cog", wordLadder: ["cot"] })).toBe(true)
  })

  it("rejects a level with nothing to find, even when the two words are adjacent", () => {
    // Begin and end are both shown from the start, so this completes itself.
    expect(isValidLevel({ id: 6, beginWord: "cat", endWord: "cot", wordLadder: [] })).toBe(false)
  })
})

describe.each(["en", "fr"] as const)("the shipped %s catalogue", (locale) => {
  const levels = CATALOGUE[locale]

  // Every level the app can hand a player has to be solvable by the one move
  // the game teaches. This is the guard that stops broken content shipping.
  it("contains only valid ladders", () => {
    const problems = validateCatalogue(levels)
    expect(
      problems.map((p) => `level ${p.levelId}: ${p.reason}`).join("\n")
    ).toBe("")
  })

  it("holds enough levels for a real progression", () => {
    expect(levels.length).toBeGreaterThanOrEqual(100)
  })

  it("has unique level ids", () => {
    const ids = levels.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("ramps difficulty rather than jumping", () => {
    // Ordered easiest first, so rung counts must never decrease.
    const rungs = levels.map((l) => l.wordLadder.length)
    expect(rungs).toEqual([...rungs].sort((a, b) => a - b))
  })

  it("gives the player at least one word to find in every level", () => {
    expect(levels.every((l) => l.wordLadder.length >= 1)).toBe(true)
  })

  // The catalogue is static, so these are assertions about a fixed artefact
  // rather than statistical guesses — they cannot flake, and they fail loudly
  // if a pipeline change quietly reintroduces the alphabetical bias.
  it("draws its opening words from across the alphabet", () => {
    // Rationing used to be spent walking an alphabetical list, so the top of
    // the dictionary took everything: 73% of French levels opened on a–f and
    // no level in either language opened on u, w, x, y or z.
    const counts = new Map<string, number>()
    for (const level of levels) {
      const initial = level.beginWord[0]
      counts.set(initial, (counts.get(initial) ?? 0) + 1)
    }
    const commonest = Math.max(...counts.values())
    expect(counts.size).toBeGreaterThanOrEqual(15)
    expect(commonest / levels.length).toBeLessThan(0.15)
  })

  it("does not always climb towards the end of the alphabet", () => {
    // The enumeration only emits a pair when the neighbour sorts after the
    // start, so every single level used to run a→z. Half are now reversed.
    const reversed = levels.filter(
      (l) => l.beginWord.localeCompare(l.endWord) > 0
    )
    expect(reversed.length / levels.length).toBeGreaterThan(0.3)
  })
})
