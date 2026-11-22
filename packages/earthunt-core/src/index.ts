export {
  EARTHUNT_API_URL,
  createEartHuntApi,
  isCountryCodes,
  isLevelResult,
  type EartHuntApi,
  type LevelResult,
  type ServerProgress,
} from "./api"
export {
  countries,
  getCountriesByCodes,
  getCountriesByContinent,
  getCountryName,
  getFlagEmoji,
  type Continent,
  type Country,
  type CountryLocale,
} from "./countries"
export { COUNTRY_DIFFICULTY_ORDER } from "./country-difficulty"
export {
  buildOfflineLevelParams,
  createGameConfig,
  getContinentLevelId,
  getDailyLevelId,
  getMissingCountries,
  getProgressiveMissingCountries,
  getWorldLevelId,
  matchCountry,
  suggestCountries,
  normalizeCountryName,
  type GameConfig,
} from "./game-logic"
export { getStars } from "./stars"
export { HINT_STEP_COSTS, judgeGuess, type GuessOutcome, type GuessVerdict } from "./guess"
export { t, tReplace, translations } from "./i18n"
