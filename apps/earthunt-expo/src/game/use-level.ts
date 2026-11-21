import {
  getCountryName,
  getStars,
  judgeGuess,
  type Country,
  type CountryLocale,
  type GameConfig,
  type GuessVerdict,
} from "@marcel-games/earthunt-core"
import { hapticError, hapticSuccess } from "@marcel-games/expo-ui"
import { useState } from "react"

/**
 * How much the hint has given away about the country it points at: nothing,
 * its first letter, where it is on the map, then its name. Each step costs a
 * hint, and the steps come in that order.
 */
export type HintStep = 0 | 1 | 2 | 3

export interface LevelPlay {
  found: string[]
  attempts: number
  hintsUsed: number
  lastVerdict: GuessVerdict | null
  /** The first country still missing, which is the one hints describe. */
  hintTarget: Country | null
  hintStep: HintStep
  isComplete: boolean
  stars: number
  guess: (input: string) => GuessVerdict
  takeHint: () => void
  firstLetter: (locale: CountryLocale) => string
}

export function useLevel(config: GameConfig, onComplete: () => void): LevelPlay {
  const [found, setFound] = useState<string[]>([])
  const [attempts, setAttempts] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [hintStep, setHintStep] = useState<HintStep>(0)
  const [lastVerdict, setLastVerdict] = useState<GuessVerdict | null>(null)

  const total = config.missingCountries.length
  const hintTarget =
    config.missingCountries.find((country) => !found.includes(country.code)) ?? null
  const isComplete = found.length === total

  const guess = (input: string) => {
    const verdict = judgeGuess(input, config, found)
    setAttempts(attempts + 1)
    setLastVerdict(verdict)

    if (verdict.outcome !== "correct" || !verdict.country) {
      hapticError()
      return verdict
    }

    hapticSuccess()
    const next = [...found, verdict.country.code]
    setFound(next)
    // The hint described this country; the next one starts untouched.
    if (verdict.country.code === hintTarget?.code) setHintStep(0)
    if (next.length === total) onComplete()
    return verdict
  }

  const takeHint = () => {
    if (isComplete || hintStep === 3) return
    setHintStep((hintStep + 1) as HintStep)
    setHintsUsed(hintsUsed + 1)
  }

  return {
    found,
    attempts,
    hintsUsed,
    lastVerdict,
    hintTarget,
    hintStep,
    isComplete,
    stars: getStars(attempts, total, hintsUsed),
    guess,
    takeHint,
    firstLetter: (locale) => (hintTarget ? getCountryName(hintTarget, locale)[0] : ""),
  }
}
