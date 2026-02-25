export type Language = "fr" | "en"

const DEFAULT_LANGUAGE: Language = "fr"

/**
 * Returns the app language based on navigator.language.
 * If French → French, else English.
 * Default (SSR or unknown) is French.
 */
export function getLanguage(): Language {
  if (typeof navigator === "undefined") return DEFAULT_LANGUAGE
  const lang = navigator.language?.toLowerCase() ?? ""
  if (lang.startsWith("fr")) return "fr"
  return "en"
}
