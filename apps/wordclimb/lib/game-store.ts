"use client"

import { CATALOGUE, type Level } from "@/lib/data/catalogue"

export type GameMode = "classic" | "daily" | "random"

// Backend game modes used by the shared API schema.
// Wordclimb modes map onto these when talking to the server.
export type BackendGameMode = "WORLD" | "LEVEL_OF_THE_DAY"

export function toBackendGameMode(mode: GameMode): BackendGameMode {
  switch (mode) {
    case "daily":
      return "LEVEL_OF_THE_DAY"
    case "classic":
    case "random":
    default:
      return "WORLD"
  }
}

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

/**
 * Levels for the language the player is reading the app in. Each locale has its
 * own catalogue: a French player must not be handed English ladders, which
 * would be unguessable.
 */
export function levelsForLocale(locale: "en" | "fr" = getSavedLocale()): Level[] {
  return CATALOGUE[locale]
}

// Get the daily level based on date
export function getDailyLevelIndex(locale: "en" | "fr" = getSavedLocale()): number {
  const today = new Date()
  const dateStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash) % levelsForLocale(locale).length
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
export function getRandomLevel(locale: "en" | "fr" = getSavedLocale()): Level {
  const levels = levelsForLocale(locale)
  const index = Math.floor(Math.random() * levels.length)
  return levels[index]
}

// Get level for a specific mode
export function getLevelForMode(
  mode: GameMode,
  locale: "en" | "fr" = getSavedLocale()
): Level {
  const levels = levelsForLocale(locale)
  switch (mode) {
    case "classic": {
      const progress = getClassicProgress()
      const index = progress % levels.length
      return levels[index]
    }
    case "daily": {
      return levels[getDailyLevelIndex(locale)]
    }
    case "random":
      return getRandomLevel(locale)
  }
}

// Create initial game state
export function createGameState(
  mode: GameMode,
  locale: "en" | "fr" = getSavedLocale()
): GameState {
  const level = getLevelForMode(mode, locale)
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
