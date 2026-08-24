"use client"

import { CATALOGUE, type Level } from "@/lib/data/catalogue"
import type { BackendGameMode, BackendLocale } from "@/lib/api"

export type GameMode = "classic" | "daily" | "random"

/**
 * Maps the UI's modes onto the GameMode enum the server stores.
 *
 * "random" used to be folded into the classic mode, which made every shuffled
 * puzzle count towards the classic progression. They are separate modes on the
 * server and are kept separate here.
 */
export function toBackendGameMode(mode: GameMode): BackendGameMode {
  switch (mode) {
    case "daily":
      return "LEVEL_OF_THE_DAY"
    case "random":
      return "RANDOM"
    case "classic":
    default:
      return "NORMAL"
  }
}

/** Maps the app's locale onto the Locale enum the server stores. */
export function toBackendLocale(locale: "en" | "fr"): BackendLocale {
  return locale === "fr" ? "FR" : "EN"
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

/**
 * The UTC day, as YYYY-MM-DD.
 *
 * The daily challenge turns over at midnight UTC on the server, so every notion
 * of "today" in the app is a UTC day. Using the device's local date instead
 * would hand players near a date boundary a different puzzle from the one the
 * server ranks them against.
 */
export function utcDateString(date: Date = new Date()): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${date.getUTCFullYear()}-${month}-${day}`
}

/**
 * Picks the daily puzzle out of a catalogue of `levelCount` levels.
 *
 * The server reproduces this exact hash in pkg/utils/level.go (DailyLevelIndex)
 * so both sides land on the same puzzle for a given day — which is what makes
 * the offline fallback play the same daily the server would have served.
 */
export function dailyLevelIndexFor(dateStr: string, levelCount: number): number {
  if (levelCount <= 0) return 0
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash) % levelCount
}

// Get the daily level based on date
export function getDailyLevelIndex(locale: "en" | "fr" = getSavedLocale()): number {
  return dailyLevelIndexFor(utcDateString(), levelsForLocale(locale).length)
}

// Check if daily challenge has been completed today, "today" being the UTC day
// the server rolls the challenge over on.
export function isDailyCompleted(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("wordclimb-daily-completed") === utcDateString()
}

export function setDailyCompleted(): void {
  if (typeof window === "undefined") return
  localStorage.setItem("wordclimb-daily-completed", utcDateString())
}

// Get a random level
export function getRandomLevel(locale: "en" | "fr" = getSavedLocale()): Level {
  const levels = levelsForLocale(locale)
  const index = Math.floor(Math.random() * levels.length)
  return levels[index]
}

/**
 * Picks a level out of the bundled catalogue — the offline fallback for when
 * the API is unreachable.
 *
 * It agrees with the server by construction: both catalogues come from a single
 * run of scripts/build-catalogue.mjs, so a locale has the same levels in the
 * same order on both sides, and the same index arithmetic lands on the same
 * puzzle.
 */
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

/**
 * Converts an API level payload into a playable level, or null when the server
 * has nothing to hand out — a daily already finished today, or a catalogue that
 * has not been populated for this language.
 *
 * Both sides use the same convention: wordLadder holds the intermediate words
 * only, with the begin and end words in their own fields.
 */
export function levelFromApi(payload: {
  level?: number
  beginWord: string
  endWord: string
  wordLadder: string[]
}): Level | null {
  if (!payload.beginWord || !payload.endWord) return null
  if (!payload.wordLadder || payload.wordLadder.length === 0) return null
  return {
    id: payload.level ?? 0,
    beginWord: payload.beginWord,
    endWord: payload.endWord,
    wordLadder: payload.wordLadder,
  }
}

/** Wraps a level — from the API or from the bundled catalogue — in a fresh game. */
export function createGameState(mode: GameMode, level: Level): GameState {
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

/** The offline path: a game built from the bundled catalogue. */
export function createLocalGameState(
  mode: GameMode,
  locale: "en" | "fr" = getSavedLocale()
): GameState {
  return createGameState(mode, getLevelForMode(mode, locale))
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
