import type { Level } from "./catalogue"
import type { Locale } from "./i18n"

export type GameMode = "classic" | "daily"

/** Game modes as declared by the GameMode enum in the server's schema.prisma. */
export type BackendGameMode = "NORMAL" | "RANDOM" | "LEVEL_OF_THE_DAY"

/** Languages as declared by the Locale enum in the server's schema.prisma. */
export type BackendLocale = "EN" | "FR"

export type GuessFeedback = "correct" | "wrong" | "already"

export function toBackendGameMode(mode: GameMode): BackendGameMode {
  switch (mode) {
    case "daily":
      return "LEVEL_OF_THE_DAY"
    case "classic":
    default:
      return "NORMAL"
  }
}

/** Maps the app's locale onto the Locale enum the server stores. */
export function toBackendLocale(locale: Locale): BackendLocale {
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
  /**
   * Coins spent on hints in this level. Sent when the level is banked, which
   * is what carries an offline spend back to the server — there is no debit
   * endpoint, because one would be unreachable exactly when it is needed.
   */
  coinsSpent: number
  isComplete: boolean
  feedback: GuessFeedback | null
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

/**
 * The classic level a player with `progress` finished levels plays next. The
 * catalogue wraps, so a player who has finished everything starts over rather
 * than running out of game.
 */
export function classicLevelAt(levels: Level[], progress: number): Level {
  return levels[progress % levels.length]
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
    coinsSpent: 0,
    isComplete: false,
    feedback: null,
  }
}

export interface GuessResult {
  state: GameState
  outcome: GuessFeedback
  /** Index in wordLadder of the rung this guess solved, or null if it solved none. */
  solvedIndex: number | null
}

/**
 * Plays one guess against the rung the player is on.
 *
 * Every guess counts as an attempt, right or wrong: accuracy is what the stars
 * are scored on. Returns null when there is nothing to play — a blank guess, or
 * a level that is already finished.
 */
export function applyGuess(state: GameState, rawGuess: string): GuessResult | null {
  const guess = rawGuess.trim().toLowerCase()
  if (!guess || state.isComplete) return null

  const { wordLadder } = state.level
  const solvedIndex = state.currentWordIndex
  const attempts = state.attempts + 1

  if (guess === wordLadder[solvedIndex].toLowerCase()) {
    const foundWords = [...state.foundWords]
    foundWords[solvedIndex] = true
    const currentWordIndex = solvedIndex + 1
    return {
      outcome: "correct",
      solvedIndex,
      state: {
        ...state,
        foundWords,
        currentWordIndex,
        attempts,
        feedback: "correct",
        isComplete: currentWordIndex >= wordLadder.length,
      },
    }
  }

  const alreadyFound = state.foundWords.some(
    (found, index) => found && wordLadder[index].toLowerCase() === guess
  )
  const outcome: GuessFeedback = alreadyFound ? "already" : "wrong"
  return {
    outcome,
    solvedIndex: null,
    state: { ...state, attempts, feedback: outcome },
  }
}
