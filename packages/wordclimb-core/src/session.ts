import type { Level } from "./catalogue"
import { applyGuess, createGameState, type GameMode, type GameState } from "./game"

/**
 * A level as it is being typed: the game itself plus the letters on the rung.
 *
 * Every function here returns the session it was given when it changes
 * nothing, so a caller can tell an ignored keystroke by identity.
 */
export interface PlaySession {
  game: GameState
  /** Letters typed on the rung being played, lowercased. */
  typed: string
  /** True while a refused guess is still shown on the rung. Typing is ignored until it is cleared. */
  refused: boolean
  /** Index in wordLadder of the word just solved, for the client to celebrate; null once settled. */
  celebrating: number | null
  /** Hints already taken on the rung being played. Taking one again is free: it tells the player nothing new. */
  hinted: RungHints
}

export interface RungHints {
  firstLetter: boolean
  definition: boolean
  fullWord: boolean
}

const NO_HINTS: RungHints = { firstLetter: false, definition: false, fullWord: false }

export function createSession(mode: GameMode, level: Level): PlaySession {
  return {
    game: createGameState(mode, level),
    typed: "",
    refused: false,
    celebrating: null,
    hinted: NO_HINTS,
  }
}

/**
 * Adds one letter to the rung. There is no submit key: the rung is played the
 * moment it is full, so the last letter of a word is also the guess.
 */
export function typeLetter(session: PlaySession, letter: string): PlaySession {
  if (session.refused || session.game.isComplete) return session

  const wordLength = session.game.level.beginWord.length
  if (session.typed.length >= wordLength) return session

  const typed = session.typed + letter.toLowerCase()
  if (typed.length < wordLength) return { ...session, typed }

  const result = applyGuess(session.game, typed)
  if (!result) return session
  if (result.solvedIndex === null) {
    return { ...session, game: result.state, typed, refused: true }
  }
  return {
    game: result.state,
    typed: "",
    refused: false,
    celebrating: result.solvedIndex,
    hinted: NO_HINTS,
  }
}

export function eraseLetter(session: PlaySession): PlaySession {
  if (session.refused || session.game.isComplete || session.typed === "") return session
  return { ...session, typed: session.typed.slice(0, -1) }
}

function countHint(session: PlaySession, hint: keyof RungHints): PlaySession {
  if (session.hinted[hint]) return session
  return {
    ...session,
    game: { ...session.game, hintsUsed: session.game.hintsUsed + 1 },
    hinted: { ...session.hinted, [hint]: true },
  }
}

/**
 * Puts the first letter of the word on the rung, replacing whatever was typed:
 * letters that do not start with it could never have been the word.
 */
export function takeFirstLetterHint(session: PlaySession): PlaySession {
  if (session.refused || session.game.isComplete) return session
  const target = session.game.level.wordLadder[session.game.currentWordIndex]
  return { ...countHint(session, "firstLetter"), typed: target[0].toLowerCase() }
}

/** Marks the definition of the word on the rung as shown. The client reads `hinted.definition`. */
export function takeDefinitionHint(session: PlaySession): PlaySession {
  if (session.game.isComplete) return session
  return countHint(session, "definition")
}

/**
 * Pays for the whole word: the rung is cleared so the caller can type the word
 * in, letter by letter, through the same path as a guess.
 */
export function takeFullWordHint(session: PlaySession): PlaySession {
  if (session.refused || session.game.isComplete) return session
  return { ...countHint(session, "fullWord"), typed: "" }
}

/**
 * The three functions below end a piece of feedback some time after the guess
 * that caused it. `attempts` names that guess: if the player has guessed again
 * since, the feedback on screen belongs to the newer guess and is left alone.
 */
export function clearRefusedGuess(session: PlaySession, attempts: number): PlaySession {
  if (!session.refused || session.game.attempts !== attempts) return session
  return { ...session, typed: "", refused: false }
}

export function settleCelebration(session: PlaySession, attempts: number): PlaySession {
  if (session.celebrating === null || session.game.attempts !== attempts) return session
  return { ...session, celebrating: null }
}

export function clearFeedback(session: PlaySession, attempts: number): PlaySession {
  if (session.game.feedback === null || session.game.attempts !== attempts) return session
  return { ...session, game: { ...session.game, feedback: null } }
}
