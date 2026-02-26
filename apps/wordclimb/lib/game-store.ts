"use client"

import { validLevels, type Level } from "@/lib/data/levels"

export type GameMode = "classic" | "daily" | "random"

export interface GameState {
  mode: GameMode
  level: Level
  currentWordIndex: number // index in wordLadder of the word the user needs to find
  foundWords: boolean[] // which intermediate words have been found
  attempts: number
  startTime: number
  hintsUsed: number
  isComplete: boolean
  feedback: "correct" | "wrong" | "already" | null
}

// Get the classic level progress from localStorage
export function getClassicProgress(): number {
  if (typeof window === "undefined") return 0
  const stored = localStorage.getItem("wordclimb-classic-progress")
  return stored ? parseInt(stored, 10) : 0
}

export function setClassicProgress(level: number): void {
  if (typeof window === "undefined") return
  localStorage.setItem("wordclimb-classic-progress", level.toString())
}

// Get the daily level based on date
export function getDailyLevelIndex(): number {
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash) % validLevels.length
}

// Check if daily challenge has been completed today
export function isDailyCompleted(): boolean {
  if (typeof window === "undefined") return false
  const today = new Date().toISOString().split("T")[0]
  const stored = localStorage.getItem("wordclimb-daily-completed")
  return stored === today
}

export function setDailyCompleted(): void {
  if (typeof window === "undefined") return
  const today = new Date().toISOString().split("T")[0]
  localStorage.setItem("wordclimb-daily-completed", today)
}

// Get a random level
export function getRandomLevel(): Level {
  const index = Math.floor(Math.random() * validLevels.length)
  return validLevels[index]
}

// Get level for a specific mode
export function getLevelForMode(mode: GameMode): Level {
  switch (mode) {
    case "classic": {
      const progress = getClassicProgress()
      const index = progress % validLevels.length
      return validLevels[index]
    }
    case "daily": {
      const index = getDailyLevelIndex()
      return validLevels[index]
    }
    case "random":
      return getRandomLevel()
  }
}

// Create initial game state
export function createGameState(mode: GameMode): GameState {
  const level = getLevelForMode(mode)
  return {
    mode,
    level,
    currentWordIndex: 0,
    foundWords: new Array(level.wordLadder.length).fill(false),
    attempts: 0,
    startTime: Date.now(),
    hintsUsed: 0,
    isComplete: false,
    feedback: null,
  }
}

// Get saved locale
export function getSavedLocale(): "en" | "fr" {
  if (typeof window === "undefined") return "en"
  const stored = localStorage.getItem("wordclimb-locale")
  return (stored === "fr" ? "fr" : "en")
}

export function saveLocale(locale: "en" | "fr"): void {
  if (typeof window === "undefined") return
  localStorage.setItem("wordclimb-locale", locale)
}

// Check first visit for welcome modal
export function isFirstVisit(): boolean {
  if (typeof window === "undefined") return true
  return !localStorage.getItem("wordclimb-visited")
}

export function setVisited(): void {
  if (typeof window === "undefined") return
  localStorage.setItem("wordclimb-visited", "true")
}
