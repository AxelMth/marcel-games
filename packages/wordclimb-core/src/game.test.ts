import { describe, expect, it } from "vitest"
import type { Level } from "./catalogue"
import { applyGuess, classicLevelAt, createGameState } from "./game"

const LEVEL: Level = {
  id: 1,
  beginWord: "pain",
  endWord: "mots",
  wordLadder: ["main", "mais", "mois"],
}

describe("applyGuess", () => {
  it("advances to the next rung on the right word", () => {
    const result = applyGuess(createGameState("classic", LEVEL), "main")

    expect(result?.outcome).toBe("correct")
    expect(result?.solvedIndex).toBe(0)
    expect(result?.state.currentWordIndex).toBe(1)
    expect(result?.state.foundWords).toEqual([true, false, false])
    expect(result?.state.isComplete).toBe(false)
  })

  it("accepts a guess whatever its case or surrounding spaces", () => {
    const result = applyGuess(createGameState("classic", LEVEL), "  MAIN ")

    expect(result?.outcome).toBe("correct")
  })

  it("counts a wrong word as an attempt without moving the player", () => {
    const start = createGameState("classic", LEVEL)
    const result = applyGuess(start, "pair")

    expect(result?.outcome).toBe("wrong")
    expect(result?.solvedIndex).toBeNull()
    expect(result?.state.attempts).toBe(1)
    expect(result?.state.currentWordIndex).toBe(0)
    expect(result?.state.foundWords).toEqual([false, false, false])
  })

  it("tells a word already found apart from a plain wrong one", () => {
    const afterFirst = applyGuess(createGameState("classic", LEVEL), "main")!.state
    const result = applyGuess(afterFirst, "main")

    expect(result?.outcome).toBe("already")
    expect(result?.state.currentWordIndex).toBe(1)
  })

  it("refuses a later rung played out of order", () => {
    const result = applyGuess(createGameState("classic", LEVEL), "mois")

    expect(result?.outcome).toBe("wrong")
  })

  it("completes the level on the last rung and counts every guess", () => {
    let state = createGameState("classic", LEVEL)
    for (const guess of ["main", "mars", "mais", "mois"]) {
      state = applyGuess(state, guess)!.state
    }

    expect(state.isComplete).toBe(true)
    expect(state.attempts).toBe(4)
    expect(state.foundWords).toEqual([true, true, true])
  })

  it("plays nothing on a blank guess or a finished level", () => {
    const start = createGameState("classic", LEVEL)
    expect(applyGuess(start, "   ")).toBeNull()

    let state = start
    for (const guess of LEVEL.wordLadder) state = applyGuess(state, guess)!.state
    expect(applyGuess(state, "mots")).toBeNull()
  })

  it("leaves the state it was given untouched", () => {
    const start = createGameState("classic", LEVEL)
    applyGuess(start, "main")

    expect(start.currentWordIndex).toBe(0)
    expect(start.foundWords).toEqual([false, false, false])
  })
})

describe("classicLevelAt", () => {
  const levels: Level[] = [LEVEL, { ...LEVEL, id: 2 }, { ...LEVEL, id: 3 }]

  it("hands out levels in catalogue order", () => {
    expect(classicLevelAt(levels, 0).id).toBe(1)
    expect(classicLevelAt(levels, 2).id).toBe(3)
  })

  it("wraps once the catalogue is exhausted", () => {
    expect(classicLevelAt(levels, 3).id).toBe(1)
  })
})
