import type { Locale } from "@marcel-games/wordclimb-core"
import { getLocales } from "expo-localization"

/**
 * The language the game is played in. Each locale has its own catalogue, so
 * this decides which words the player is asked for, not just the labels.
 */
export function deviceLocale(): Locale {
  return getLocales()[0]?.languageCode === "fr" ? "fr" : "en"
}
