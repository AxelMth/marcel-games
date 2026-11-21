import {
  clearFeedback,
  clearRefusedGuess,
  HINT_COSTS,
  createSession,
  eraseLetter,
  settleCelebration,
  takeDefinitionHint,
  takeFirstLetterHint,
  typeLetter,
  type GameState,
  type Level,
  type PlaySession,
  type RungHints,
} from "@marcel-games/wordclimb-core"
import { useCallback, useEffect, useRef, useState } from "react"
import { LETTER_STAGGER_MS } from "@/components/tile"
import { payCoins } from "@/game/wallet-store"
import { hapticError, hapticKey, hapticSuccess } from "@marcel-games/expo-ui"

/** Time for the last letter of a solved word to land after its turn in the ripple. */
const FOUND_ANIM_MS = 400
/** How long a refused guess stays on screen before the rung is cleared. */
const WRONG_HOLD_MS = 600
const FEEDBACK_MS = 1500

export interface Game {
  session: PlaySession
  pressLetter: (letter: string) => void
  erase: () => void
  /** Both answer false when the hint could not be paid for. */
  hintFirstLetter: () => boolean
  hintDefinition: () => boolean
}

/** One level being played, with the haptics and timed feedback around it. */
export function useGame(level: Level, onComplete: (finished: GameState) => void): Game {
  const [session, setSession] = useState(() => createSession("classic", level))
  // Keystrokes are applied to this, not to the rendered state: two keys pressed
  // within one frame would otherwise both start from the same letters, and the
  // second would overwrite the first.
  const latest = useRef(session)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    for (const timer of timers.current) clearTimeout(timer)
    timers.current = []
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const commit = (next: PlaySession) => {
    latest.current = next
    setSession(next)
  }

  const later = (change: (current: PlaySession) => PlaySession, delay: number) => {
    timers.current.push(setTimeout(() => commit(change(latest.current)), delay))
  }

  const pressLetter = (letter: string) => {
    const before = latest.current
    const after = typeLetter(before, letter)
    if (after === before) return

    hapticKey()
    commit(after)

    const { attempts } = after.game
    if (attempts === before.game.attempts) return

    if (after.refused) {
      hapticError()
      later((current) => clearRefusedGuess(current, attempts), WRONG_HOLD_MS)
    } else {
      hapticSuccess()
      const ripple = level.beginWord.length * LETTER_STAGGER_MS + FOUND_ANIM_MS
      later((current) => settleCelebration(current, attempts), ripple)
      if (after.game.isComplete) onComplete(after.game)
    }
    later((current) => clearFeedback(current, attempts), FEEDBACK_MS)
  }

  const erase = () => {
    const before = latest.current
    const after = eraseLetter(before)
    if (after === before) return
    hapticKey()
    commit(after)
  }

  // A hint already taken on this rung is free: paying again would buy nothing.
  const takeHint = (hint: keyof RungHints, take: (current: PlaySession) => PlaySession) => {
    const before = latest.current
    if (before.game.isComplete) return true
    if (!before.hinted[hint] && !payCoins(HINT_COSTS[hint])) return false
    hapticKey()
    commit(take(before))
    return true
  }

  return {
    session,
    pressLetter,
    erase,
    hintFirstLetter: () => takeHint("firstLetter", takeFirstLetterHint),
    hintDefinition: () => takeHint("definition", takeDefinitionHint),
  }
}
