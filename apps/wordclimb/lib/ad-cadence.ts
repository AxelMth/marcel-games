import { NUMBER_OF_LEVELS_BETWEEN_ADS } from "./ad-constants"
import type { GameMode } from "./game-store"

export interface CadenceInput {
  /** The mode of the level that was just completed. */
  mode: GameMode
  /** The level number that was just completed, not the one being started. */
  level: number
}

export interface InterstitialInput extends CadenceInput {
  /** False once the session's single exemption has been spent. */
  exemptionAvailable: boolean
}

export interface InterstitialOutcome {
  show: boolean
  /** True when the ad was due but the exemption absorbed it. */
  consumesExemption: boolean
}

/**
 * Whether the cadence alone calls for an ad, ignoring the session exemption.
 * Only Classic chains levels together; Daily and Random are one-off puzzles
 * with no "next level" to gate, so they never show an interstitial.
 */
export function isAdDue({ mode, level }: CadenceInput): boolean {
  if (mode !== "classic") return false
  return level > 0 && level % NUMBER_OF_LEVELS_BETWEEN_ADS === 0
}

/**
 * Decides whether to show an interstitial when the player finishes a level.
 *
 * Lives outside the success modal so the revenue-critical rule is testable
 * without mounting React or faking AdMob: in a browser
 * `Capacitor.isNativePlatform()` is false and every ad path short-circuits, so
 * an end-to-end test can never observe this decision.
 *
 * The session gets exactly one exemption, spent the first time an ad is
 * actually due. Classic progress is stored and resumed, so a player returning
 * at level 15 would otherwise meet a full-screen ad after a single puzzle,
 * before earning anything — the placement most likely to cost a returning
 * player. Spending it on the first *due* ad rather than on the first level
 * played matters: backing out, or playing puzzles that are not multiples of
 * the cadence, must not quietly burn it.
 */
export function resolveInterstitial({
  mode,
  level,
  exemptionAvailable,
}: InterstitialInput): InterstitialOutcome {
  if (!isAdDue({ mode, level })) {
    return { show: false, consumesExemption: false }
  }
  if (exemptionAvailable) {
    return { show: false, consumesExemption: true }
  }
  return { show: true, consumesExemption: false }
}
