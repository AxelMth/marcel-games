import type { Language } from "@marcel-games/lib"

const translations: Record<Language, Record<string, string>> = {
  fr: {
    "splash.subtitle": "Le quiz de geographie",
    "home.world": "Monde",
    "home.worldSubtitle": "Trouvez les pays manquants",
    "home.continent": "Continent",
    "home.continentSubtitle": "Jouez par continent",
    "home.daily": "Quotidien",
    "home.dailySubtitle": "Le defi du jour",
    "home.doneForToday": "Deja joue aujourd'hui",
    "home.scrollToSelect": "Faites defiler pour choisir un mode",
    "continentSelect.level": "Niveau",
    "profile.loading": "Chargement...",
    "errors.couldNotStartGame": "Impossible de demarrer la partie",
    "errors.failedToLoad": "Erreur de chargement",
  },
  en: {
    "splash.subtitle": "The geography quiz",
    "home.world": "World",
    "home.worldSubtitle": "Find the missing countries",
    "home.continent": "Continent",
    "home.continentSubtitle": "Play by continent",
    "home.daily": "Daily",
    "home.dailySubtitle": "Today's challenge",
    "home.doneForToday": "Already played today",
    "home.scrollToSelect": "Scroll to select a mode",
    "continentSelect.level": "Level",
    "profile.loading": "Loading...",
    "errors.couldNotStartGame": "Could not start game",
    "errors.failedToLoad": "Failed to load",
  },
}

export function t(lang: Language, key: string): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key
}

export function tReplace(
  lang: Language,
  key: string,
  params: Record<string, string>
): string {
  let text = t(lang, key)
  for (const [k, v] of Object.entries(params)) {
    text = text.replaceAll(`{{${k}}}`, v)
  }
  return text
}
