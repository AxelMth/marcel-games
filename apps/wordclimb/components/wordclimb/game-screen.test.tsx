import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { act, render, screen } from "@testing-library/react"
import { useState } from "react"
import type { GameState } from "@/lib/game-store"
import { GameScreen } from "./game-screen"

/**
 * The feedback sequence, which is the part that is easy to get wrong and
 * impossible to see in a screenshot.
 *
 * A refused guess has to stay on screen long enough to be read — clearing the
 * row on the spot was the old behaviour, and it left the player with a blank
 * rung and no idea which word had been rejected. Typing is locked for exactly
 * that window, and the timers belong to the guess that armed them: two wrong
 * words in a row used to leave the first one's timer running, and it wiped the
 * second guess's letters a few hundred milliseconds after they appeared.
 */

const LEVEL = {
  id: 1,
  beginWord: "back",
  endWord: "bend",
  wordLadder: ["bank", "band"],
}

function initialState(): GameState {
  return {
    mode: "classic",
    level: LEVEL,
    currentWordIndex: 0,
    foundWords: [false, false],
    attempts: 0,
    startTime: 1_700_000_000_000,
    hintsUsed: 0,
    coinsSpent: 0,
    isComplete: false,
    feedback: null,
  }
}

// The screen pulls everything off the context; standing in for it is what lets
// the test start mid-game without driving the whole app to get there.
const { useAppMock } = vi.hoisted(() => ({ useAppMock: vi.fn() }))
vi.mock("@/lib/app-context", () => ({ useApp: useAppMock }))

function Harness() {
  const [gameState, setGameState] = useState<GameState | null>(initialState)
  useAppMock.mockImplementation(() => ({
    locale: "en" as const,
    gameState,
    setGameState,
    goHome: vi.fn(),
    userId: null,
    setProgress: vi.fn(),
  }))
  return <GameScreen />
}

function field() {
  return screen.getByRole("textbox") as HTMLInputElement
}

function type(word: string) {
  const input = field()
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )!.set!
    setter.call(input, word)
    input.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

describe("GameScreen feedback", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it("holds a refused guess on screen, then clears it", () => {
    render(<Harness />)
    type("zzzz")

    // Still readable while it flashes red.
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(field().value).toBe("zzzz")

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(field().value).toBe("")
  })

  it("ignores keystrokes while a refused guess is still showing", () => {
    render(<Harness />)
    type("zzzz")

    act(() => {
      vi.advanceTimersByTime(100)
    })
    type("q")
    // The refused guess is what stays up: a stray keystroke must not start a
    // new word underneath it.
    expect(field().value).toBe("zzzz")
  })

  it("does not let one guess's timer clear the next guess", () => {
    render(<Harness />)
    type("zzzz")

    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(field().value).toBe("")

    // A second wrong word must get its own full window rather than being cut
    // short by whatever the first one left running.
    type("qqqq")
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(field().value).toBe("qqqq")

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(field().value).toBe("")
  })

  it("lights the solved word up letter by letter", () => {
    render(<Harness />)
    type("bank")

    // The row that was just solved carries the stagger, one delay per letter.
    const lit = document.querySelectorAll(".wc-letter-found")
    expect(lit.length).toBe(4)
    expect((lit[0] as HTMLElement).style.animationDelay).toBe("")
    expect((lit[3] as HTMLElement).style.animationDelay).toBe("210ms")

    // And it settles back to plain "found" colours once the run is over.
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(document.querySelectorAll(".wc-letter-found").length).toBe(0)
  })

  it("flashes every letter of a refused guess at once", () => {
    render(<Harness />)
    type("zzzz")

    const flashed = document.querySelectorAll(".wc-letter-wrong")
    expect(flashed.length).toBe(4)
    // No stagger here: the whole guess is refused, not one letter of it.
    for (const box of flashed) {
      expect((box as HTMLElement).style.animationDelay).toBe("")
    }
    expect(document.querySelector(".wc-row-shake")).not.toBeNull()
  })
})
