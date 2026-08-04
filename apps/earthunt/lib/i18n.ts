import type { Language } from "./language"

export const translations = {
  en: {
    app: {
      title: "EartHunt",
      subtitle: "Find the missing countries",
    },
    splash: {
      subtitle: "Find the missing countries",
    },
    home: {
      world: "World",
      continent: "Continent",
      daily: "Daily Challenge",
      worldSubtitle: "Find countries across the entire globe",
      continentSubtitle: "Focus on a specific region",
      dailySubtitle: "A new challenge every day",
      doneForToday: "Done for today",
      scrollToSelect: "Scroll to select game mode",
    },
    continentSelect: {
      title: "Choose a Continent",
      EUROPE: "Europe",
      ASIA: "Asia",
      AMERICAS: "Americas",
      AFRICA: "Africa",
      OCEANIA: "Oceania",
      level: "Level",
      scrollToSelect: "Scroll to select continent",
    },
    game: {
      dailyChallenge: "Daily Challenge",
      worldLevel: "World - Level {{level}}",
      continentLevel: "{{continent}} - Lvl {{level}}",
      enterCountryName: "Enter a country name...",
      mapUnavailable:
        "The map could not load. You can still play: type the names of the missing countries.",
      missing: "missing", // Used as "X missing" (plural)
      missingOne: "missing", // Used as "1 missing"
      allCountriesFound: "All countries have been found",
    },
    helpBubble: {
      howToPlay: "How to Play",
      hints: "Hints",
    },
    hintsHelp: {
      tapHint: "Tap a hint to reveal information about a missing country:",
      firstLetter: "First Letter",
      firstLetterDesc: "Reveals the first letter of a missing country",
      showOnMap: "Show on Map",
      showOnMapDesc: "Briefly highlights a missing country on the map",
      unlockFirstLetter: "Unlock by using First Letter first",
      fullName: "Full Name",
      fullNameDesc: "Reveals the full name of a missing country",
      unlockMapFirst: "Unlock by using First Letter and Show on Map first",
      mapHintResult: "Check the map - highlighted in yellow!",
      startsWith: 'Starts with "{{letter}}"',
      chooseMode: "Choose a Mode",
      chooseModeDesc: "Pick World, Continent, or Daily Challenge from the home screen.",
      findMissing: "Find Missing Countries",
      findMissingDesc:
        "Some countries are removed from the map. Type their names in the search bar to find them.",
      useMap: "Use the Map",
      useMapDesc:
        "Pan and zoom the interactive map. Missing countries appear as dashed outlines. Found countries turn green.",
      getHints: "Get Hints",
      getHintsDesc:
        "Stuck? Use hints to reveal the first letter, highlight the location, or show the full name.",
      gotIt: "Got it!",
    },
    success: {
      perfect: "Perfect!",
      greatJob: "Great Job!",
      wellDone: "Well Done!",
      countriesFound: "Countries Found",
      totalTime: "Total Time",
      accuracy: "Accuracy",
      hintsUsed: "Hints Used",
      backToHome: "Back to Home",
      nextLevel: "Next Level",
    },
    errors: {
      couldNotStartGame: "Could not start game",
      failedToLoad: "Failed to load level",
    },
    stats: {
      gameMode: "Game mode",
      allModes: "All",
    },
    profile: {
      back: "Back",
      settings: "Settings",
      gameHistory: "Game History",
      worldRanking: "World Ranking",
      stats: "Stats",
      daysCompleted: "Days completed",
      todaysRank: "Today's rank",
      globalRank: "Daily challenge rank",
      close: "Close",
      loading: "Loading...",
      noHistory: "No games played yet",
      noUser: "Start a game to see your stats",
      level: "Level",
      bestRankInMode: "Best rank in this mode",
      globalRankInMode: "Best rank in this mode",
      notRanked: "Not ranked yet",
    },
    legal: {
      open: "Privacy & Terms",
      privacyTitle: "Privacy Policy",
      termsTitle: "Terms of Use",
      lastUpdated: "Last updated",
      close: "Close",
    },
  },
  fr: {
    app: {
      title: "EartHunt",
      subtitle: "Trouve les pays manquants",
    },
    splash: {
      subtitle: "Trouve les pays manquants",
    },
    home: {
      world: "Monde",
      continent: "Continent",
      daily: "Défi du jour",
      worldSubtitle: "Retrouve les pays du monde entier",
      continentSubtitle: "Concentre-toi sur une région",
      dailySubtitle: "Un nouveau défi chaque jour",
      doneForToday: "Terminé pour aujourd'hui",
      scrollToSelect: "Glisse pour choisir le mode",
    },
    continentSelect: {
      title: "Choisis un continent",
      EUROPE: "Europe",
      ASIA: "Asie",
      AMERICAS: "Amériques",
      AFRICA: "Afrique",
      OCEANIA: "Océanie",
      level: "Niveau",
      scrollToSelect: "Glisse pour choisir le continent",
    },
    game: {
      dailyChallenge: "Défi du jour",
      worldLevel: "Monde - Niveau {{level}}",
      continentLevel: "{{continent}} - Niv. {{level}}",
      enterCountryName: "Tape le nom d'un pays...",
      mapUnavailable:
        "La carte n'a pas pu se charger. Tu peux quand même jouer : tape le nom des pays manquants.",
      missing: "manquants", // Used as "X manquants" (plural)
      missingOne: "manquant", // Used as "1 manquant"
      allCountriesFound: "Tous les pays ont été trouvés",
    },
    helpBubble: {
      howToPlay: "Comment jouer",
      hints: "Indices",
    },
    hintsHelp: {
      tapHint: "Choisis un indice pour révéler un pays manquant :",
      firstLetter: "Première lettre",
      firstLetterDesc: "Révèle la première lettre d'un pays manquant",
      showOnMap: "Voir sur la carte",
      showOnMapDesc: "Met en évidence un pays manquant sur la carte",
      unlockFirstLetter: "Utilise d'abord Première lettre",
      fullName: "Nom complet",
      fullNameDesc: "Révèle le nom complet d'un pays manquant",
      unlockMapFirst: "Utilise d'abord Première lettre et Voir sur la carte",
      mapHintResult: "Regarde la carte - surligné en jaune !",
      startsWith: 'Commence par "{{letter}}"',
      chooseMode: "Choisir un mode",
      chooseModeDesc: "Choisis Monde, Continent ou Défi du jour sur l'écran d'accueil.",
      findMissing: "Trouver les pays manquants",
      findMissingDesc:
        "Certains pays sont retirés de la carte. Tape leurs noms dans la barre de recherche.",
      useMap: "Utiliser la carte",
      useMapDesc:
        "Déplace et zoome sur la carte. Les pays manquants apparaissent en pointillés. Les pays trouvés deviennent verts.",
      getHints: "Obtenir des indices",
      getHintsDesc:
        "Bloqué ? Utilise les indices pour révéler la première lettre, la position ou le nom complet.",
      gotIt: "Compris !",
    },
    success: {
      perfect: "Parfait !",
      greatJob: "Très bien !",
      wellDone: "Bravo !",
      countriesFound: "Pays trouvés",
      totalTime: "Temps total",
      accuracy: "Précision",
      hintsUsed: "Indices utilisés",
      backToHome: "Retour à l'accueil",
      nextLevel: "Niveau suivant",
    },
    errors: {
      couldNotStartGame: "Impossible de démarrer le jeu",
      failedToLoad: "Échec du chargement du niveau",
    },
    stats: {
      gameMode: "Mode de jeu",
      allModes: "Tous",
    },
    profile: {
      back: "Retour",
      settings: "Paramètres",
      gameHistory: "Historique des parties",
      worldRanking: "Classement mondial",
      stats: "Statistiques",
      daysCompleted: "Jours complétés",
      todaysRank: "Rang du jour",
      globalRank: "Rang au défi du jour",
      close: "Fermer",
      loading: "Chargement...",
      noHistory: "Aucune partie jouée",
      noUser: "Lance une partie pour voir tes stats",
      level: "Niveau",
      bestRankInMode: "Meilleur rang dans ce mode",
      globalRankInMode: "Meilleur rang dans ce mode",
      notRanked: "Pas encore classé",
    },
    legal: {
      open: "Confidentialité & CGU",
      privacyTitle: "Politique de confidentialité",
      termsTitle: "Conditions d'utilisation",
      lastUpdated: "Dernière mise à jour",
      close: "Fermer",
    },
  },
} as const

function getNested(obj: Record<string, unknown>, keys: string[]): unknown {
  let value: unknown = obj
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k]
    } else {
      return undefined
    }
  }
  return value
}

export function t(lang: Language, key: string): string {
  const keys = key.split(".")
  const value = getNested(translations[lang] as Record<string, unknown>, keys)
  if (typeof value === "string") return value
  const fallback = getNested(translations.en as Record<string, unknown>, keys)
  return typeof fallback === "string" ? fallback : key
}

export function tReplace(
  lang: Language,
  key: string,
  params: Record<string, string | number>
): string {
  let str = t(lang, key)
  for (const [k, v] of Object.entries(params)) {
    str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v))
  }
  return str
}
