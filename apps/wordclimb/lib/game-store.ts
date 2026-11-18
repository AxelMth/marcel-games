"use client"

import {
  CATALOGUE,
  classicLevelAt,
  createGameState,
  dailyLevelIndexFor,
  utcDateString,
  type GameMode,
  type GameState,
  type Level,
} from "@marcel-games/wordclimb-core"

export {
  createGameState,
  dailyLevelIndexFor,
  levelFromApi,
  toBackendGameMode,
  toBackendLocale,
  utcDateString,
  type GameMode,
  type GameState,
} from "@marcel-games/wordclimb-core"

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
      return classicLevelAt(levels, getClassicProgress())
    }
    case "daily": {
      return levels[getDailyLevelIndex(locale)]
    }
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
