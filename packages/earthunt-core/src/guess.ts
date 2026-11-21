import type { Country } from "./countries"
import { matchCountry, type GameConfig } from "./game-logic"

export type GuessOutcome = "correct" | "already-found" | "not-missing" | "invalid"

export interface GuessVerdict {
  outcome: GuessOutcome
  /** The country the input named, when it named one. */
  country: Country | null
}

/**
 * Judges one typed name against a level.
 *
 * A name is matched against every country the level shows, not only the
 * missing ones, so a real country that is simply not asked for can be told
 * apart from a typo — the player learns something different from each.
 */
export function judgeGuess(
  input: string,
  config: GameConfig,
  foundCodes: readonly string[]
): GuessVerdict {
  const country = matchCountry(input, config.allCountries)
  if (!country) return { outcome: "invalid", country: null }
  if (foundCodes.includes(country.code)) return { outcome: "already-found", country }
  const missing = config.missingCountries.some((candidate) => candidate.code === country.code)
  return { outcome: missing ? "correct" : "not-missing", country }
}
