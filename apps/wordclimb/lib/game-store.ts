"use client"

import { create } from "zustand"
import { LEVELS, type WordLevel } from "./data/levels"
import { DEFINITIONS } from "./data/definitions"
import type { Language } from "@marcel-games/lib"

export type TileState = "empty" | "filled" | "correct" | "present" | "absent"

export interface Tile {
  letter: string
  state: TileState
}

interface GameState {
  // Level progress
  currentLevelIndex: number
  currentLevel: WordLevel | null

  // Guessing state
  guesses: Tile[][]
  currentRow: number
  currentCol: number

  // Keyboard coloring
  letterStates: Record<string, TileState>

  // Game status
  isWon: boolean
  isLost: boolean
  showDefinition: boolean

  // Actions
  init: (levelIndex?: number) => void
  addLetter: (letter: string) => void
  removeLetter: () => void
  submitGuess: () => void
  nextLevel: () => void
  getDefinition: (lang: Language) => string
}

const MAX_GUESSES = 6

function createEmptyGrid(wordLength: number): Tile[][] {
  return Array.from({ length: MAX_GUESSES }, () =>
    Array.from({ length: wordLength }, () => ({ letter: "", state: "empty" as TileState }))
  )
}

function evaluateGuess(guess: string, answer: string): TileState[] {
  const result: TileState[] = Array(answer.length).fill("absent")
  const answerArr = answer.split("")
  const used = Array(answer.length).fill(false)

  // First pass: find correct letters
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answerArr[i]) {
      result[i] = "correct"
      used[i] = true
    }
  }

  // Second pass: find present letters
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "correct") continue
    for (let j = 0; j < answerArr.length; j++) {
      if (!used[j] && guess[i] === answerArr[j]) {
        result[i] = "present"
        used[j] = true
        break
      }
    }
  }

  return result
}

export const useGameStore = create<GameState>((set, get) => ({
  currentLevelIndex: 0,
  currentLevel: null,
  guesses: [],
  currentRow: 0,
  currentCol: 0,
  letterStates: {},
  isWon: false,
  isLost: false,
  showDefinition: false,

  init: (levelIndex = 0) => {
    const level = LEVELS[levelIndex] ?? LEVELS[0]
    set({
      currentLevelIndex: levelIndex,
      currentLevel: level,
      guesses: createEmptyGrid(level.word.length),
      currentRow: 0,
      currentCol: 0,
      letterStates: {},
      isWon: false,
      isLost: false,
      showDefinition: false,
    })
  },

  addLetter: (letter: string) => {
    const { guesses, currentRow, currentCol, currentLevel, isWon, isLost } = get()
    if (isWon || isLost || !currentLevel) return
    if (currentCol >= currentLevel.word.length) return

    const newGuesses = guesses.map((row) => row.map((t) => ({ ...t })))
    newGuesses[currentRow][currentCol] = { letter: letter.toUpperCase(), state: "filled" }
    set({ guesses: newGuesses, currentCol: currentCol + 1 })
  },

  removeLetter: () => {
    const { guesses, currentRow, currentCol, isWon, isLost } = get()
    if (isWon || isLost) return
    if (currentCol <= 0) return

    const newGuesses = guesses.map((row) => row.map((t) => ({ ...t })))
    newGuesses[currentRow][currentCol - 1] = { letter: "", state: "empty" }
    set({ guesses: newGuesses, currentCol: currentCol - 1 })
  },

  submitGuess: () => {
    const { guesses, currentRow, currentCol, currentLevel, letterStates, isWon, isLost } = get()
    if (isWon || isLost || !currentLevel) return
    if (currentCol < currentLevel.word.length) return

    const guessWord = guesses[currentRow].map((t) => t.letter).join("")
    const answer = currentLevel.word.toUpperCase()
    const evaluation = evaluateGuess(guessWord, answer)

    const newGuesses = guesses.map((row) => row.map((t) => ({ ...t })))
    const newLetterStates = { ...letterStates }

    for (let i = 0; i < evaluation.length; i++) {
      newGuesses[currentRow][i].state = evaluation[i]
      const l = guessWord[i]
      const prev = newLetterStates[l]
      if (evaluation[i] === "correct") {
        newLetterStates[l] = "correct"
      } else if (evaluation[i] === "present" && prev !== "correct") {
        newLetterStates[l] = "present"
      } else if (!prev) {
        newLetterStates[l] = "absent"
      }
    }

    const won = guessWord === answer
    const lost = !won && currentRow >= MAX_GUESSES - 1

    set({
      guesses: newGuesses,
      letterStates: newLetterStates,
      currentRow: currentRow + 1,
      currentCol: 0,
      isWon: won,
      isLost: lost,
      showDefinition: won || lost,
    })
  },

  nextLevel: () => {
    const { currentLevelIndex } = get()
    const nextIndex = currentLevelIndex + 1
    if (nextIndex < LEVELS.length) {
      get().init(nextIndex)
    }
  },

  getDefinition: (lang: Language) => {
    const { currentLevel } = get()
    if (!currentLevel) return ""
    const def = DEFINITIONS[currentLevel.word.toLowerCase()]
    if (!def) return ""
    return def[lang] ?? def.en ?? ""
  },
}))
