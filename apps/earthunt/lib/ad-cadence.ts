import { NUMBER_OF_LEVELS_BETWEEN_ADS } from "./ad-constants"
import type { GameModeLocal } from "./game-store"

export interface CadenceInput {
  /** The mode of the level that was just completed. */
  mode: GameModeLocal
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
 * Daily has no "next level" progression, so it never shows one.
 */
export function isAdDue({ mode, level }: CadenceInput): boolean {
  if (mode === "daily") return false
  return level > 0 && level % NUMBER_OF_LEVELS_BETWEEN_ADS === 0
}

/**
 * Decides whether to show an interstitial when the player taps "Next level".
 *
 * Lives outside SuccessScreen so the revenue-critical rule is testable without
 * mounting React or faking AdMob: in a browser `Capacitor.isNativePlatform()`
 * is false and every ad path short-circuits, so an end-to-end test can never
 * observe this decision.
 *
 * The session gets exactly one exemption, and it is spent the first time an ad
 * is actually due — not merely when a level starts. The cadence keys on the
 * ABSOLUTE level the server returns (last finished + 1), so a player resuming
 * at level 15 would otherwise meet a full-screen ad after a single level, about
 * ninety seconds after opening the app and before earning anything.
 *
 * Spending it on the first *due* ad rather than on the first *started* level
 * matters: backing out of a level, or playing a few levels that are not
 * multiples of the cadence, must not quietly burn the exemption.
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
