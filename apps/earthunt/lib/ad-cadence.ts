import { NUMBER_OF_LEVELS_BETWEEN_ADS } from "./ad-constants"
import type { GameModeLocal } from "./game-store"

export interface InterstitialDecision {
  /** The mode of the level that was just completed. */
  mode: GameModeLocal
  /** The level number that was just completed, not the one being started. */
  level: number
  /**
   * True when the current world level came straight from setGameFromLevel,
   * i.e. the first level of a world session (online or offline).
   */
  worldLevelWasFromApiLoad: boolean
}

/**
 * Decides whether to show an interstitial when the player taps "Next level".
 *
 * Extracted from SuccessScreen so the revenue-critical rule is testable without
 * mounting React or faking AdMob: in a browser `Capacitor.isNativePlatform()` is
 * false and every ad path short-circuits, so an end-to-end test can never
 * observe this decision.
 *
 * Rules, in order:
 * - Daily mode has no "next level" progression, so it never shows one.
 * - The first world level of a session is exempt (see worldLevelWasFromApiLoad).
 * - Otherwise, every NUMBER_OF_LEVELS_BETWEEN_ADS completed levels.
 */
export function shouldShowInterstitial({
  mode,
  level,
  worldLevelWasFromApiLoad,
}: InterstitialDecision): boolean {
  if (mode === "daily") return false
  if (mode === "world" && worldLevelWasFromApiLoad) return false
  return level > 0 && level % NUMBER_OF_LEVELS_BETWEEN_ADS === 0
}
