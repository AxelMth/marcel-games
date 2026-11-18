import { describe, expect, it } from "vitest"
import type { Level } from "./catalogue"
import {
  clearFeedback,
  clearRefusedGuess,
  createSession,
  eraseLetter,
  settleCelebration,
  typeLetter,
  type PlaySession,
} from "./session"

const LEVEL: Level = {
  id: 1,
  beginWord: "pain",
  endWord: "mots",
  wordLadder: ["main", "mais", "mois"],
}

function type(session: PlaySession, letters: string): PlaySession {
  return [...letters].reduce(typeLetter, session)
}

describe("typeLetter", () => {
  it("collects letters without playing until the rung is full", () => {
    const session = type(createSession("classic", LEVEL), "mai")

    expect(session.typed).toBe("mai")
    expect(session.game.attempts).toBe(0)
  })

  it("plays the guess on the last letter and frees the rung when it is right", () => {
    const session = type(createSession("classic", LEVEL), "main")

    expect(session.typed).toBe("")
    expect(session.celebrating).toBe(0)
    expect(session.game.currentWordIndex).toBe(1)
    expect(session.game.feedback).toBe("correct")
  })

  it("keeps a refused guess on the rung and ignores typing meanwhile", () => {
    const refused = type(createSession("classic", LEVEL), "pair")

    expect(refused.refused).toBe(true)
    expect(refused.typed).toBe("pair")
    expect(refused.game.attempts).toBe(1)
    expect(typeLetter(refused, "m")).toBe(refused)
  })

  it("lowercases what the keyboard sends", () => {
    expect(type(createSession("classic", LEVEL), "MAIN").celebrating).toBe(0)
  })

  it("counts every keystroke typed in quick succession", () => {
    const session = type(createSession("classic", LEVEL), "mainmaismois")

    expect(session.game.isComplete).toBe(true)
    expect(session.game.attempts).toBe(3)
  })

  it("ignores typing once the level is finished", () => {
    const finished = type(createSession("classic", LEVEL), "mainmaismois")

    expect(typeLetter(finished, "a")).toBe(finished)
  })
})

describe("eraseLetter", () => {
  it("removes the last letter", () => {
    expect(eraseLetter(type(createSession("classic", LEVEL), "ma")).typed).toBe("m")
  })

  it("changes nothing on an empty rung or a refused guess", () => {
    const empty = createSession("classic", LEVEL)
    const refused = type(empty, "pair")

    expect(eraseLetter(empty)).toBe(empty)
    expect(eraseLetter(refused)).toBe(refused)
  })
})

describe("ending feedback", () => {
  it("clears a refused guess so the rung can be typed on again", () => {
    const refused = type(createSession("classic", LEVEL), "pair")
    const cleared = clearRefusedGuess(refused, refused.game.attempts)

    expect(cleared.refused).toBe(false)
    expect(cleared.typed).toBe("")
    expect(type(cleared, "main").celebrating).toBe(0)
  })

  it("settles a celebration and drops the status message", () => {
    const solved = type(createSession("classic", LEVEL), "main")
    const settled = clearFeedback(settleCelebration(solved, 1), 1)

    expect(settled.celebrating).toBeNull()
    expect(settled.game.feedback).toBeNull()
  })

  it("leaves feedback alone when the player has guessed again since", () => {
    const first = type(createSession("classic", LEVEL), "main")
    const second = type(first, "mais")

    expect(settleCelebration(second, first.game.attempts)).toBe(second)
    expect(clearFeedback(second, first.game.attempts)).toBe(second)
    expect(second.celebrating).toBe(1)
  })
})
