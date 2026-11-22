export {
  WORDCLIMB_API_URL,
  createWordClimbApi,
  isLevel,
  isHistoryEntry,
  isLevelResult,
  type HistoryEntry,
  type LevelResult,
  type WordClimbApi,
} from "./api"
export { CATALOGUE, type Level } from "./catalogue"
export { DEFINITIONS, getDefinition, hasDefinition } from "./definitions"
export {
  applyGuess,
  classicLevelAt,
  createGameState,
  dailyLevelIndexFor,
  levelFromApi,
  toBackendGameMode,
  toBackendLocale,
  utcDateString,
  type BackendGameMode,
  type BackendLocale,
  type GameMode,
  type GameState,
  type GuessFeedback,
  type GuessResult,
} from "./game"
export { t, translations, type Locale, type TranslationKey } from "./i18n"
export {
  fullChain,
  hammingDistance,
  isValidLevel,
  validateCatalogue,
  validateLevel,
  type LadderProblem,
} from "./ladder-validation"
export {
  clearFeedback,
  clearRefusedGuess,
  createSession,
  eraseLetter,
  settleCelebration,
  takeDefinitionHint,
  takeFullWordHint,
  takeFirstLetterHint,
  typeLetter,
  type PlaySession,
  type RungHints,
} from "./session"
export { getStars } from "./stars"
export {
  HINT_COSTS,
  WEEKLY_COIN_ALLOWANCE,
  isoWeekId,
  openWallet,
  rewardForStars,
  spendCoins,
  type HintType,
  type Wallet,
} from "./wallet"
