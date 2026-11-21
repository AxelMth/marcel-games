import type { CountryLocale } from "@marcel-games/earthunt-core"
import { getLocales } from "expo-localization"

/** The language of the labels and of the country names the player is expected to type. */
export function deviceLocale(): CountryLocale {
  return getLocales()[0]?.languageCode === "fr" ? "fr" : "en"
}
