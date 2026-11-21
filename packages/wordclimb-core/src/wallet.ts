/**
 * Hint currency.
 *
 * Coins ration how many hints a player may take; stars still say how well they
 * played without them. Paying for a hint buys the answer, not the score.
 */
export const HINT_COSTS = {
  firstLetter: 1,
  definition: 1,
  // Three times the others: it does not help the player find the word, it
  // hands it over and moves the ladder on.
  fullWord: 3,
} as const

export type HintType = keyof typeof HINT_COSTS

export {
  WEEKLY_COIN_ALLOWANCE,
  isoWeekId,
  openWallet,
  rewardForStars,
  spendCoins,
  type Wallet,
} from "@marcel-games/game-sync"
