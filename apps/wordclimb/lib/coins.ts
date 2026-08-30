"use client"

/**
 * Hint currency.
 *
 * Hints used to be free and unlimited, which made "reveal the whole word" the
 * cheapest way through a level the player could not solve. Coins put a real
 * cost on that. The star penalty is unchanged and deliberately so: coins ration
 * how many hints a player may take, stars still say how well they played
 * without them. Paying for a hint buys the answer, not the score.
 *
 * The server owns the balance. This module is the local mirror that lets the
 * game be played with no network: it spends optimistically and is overwritten
 * by the server's number whenever one arrives.
 */

export const HINT_COSTS = {
  firstLetter: 1,
  definition: 1,
  // Three times the others: it does not help the player find the word, it
  // hands it over and moves the ladder on.
  fullWord: 3,
} as const

export type HintType = keyof typeof HINT_COSTS

/** Free coins granted at the start of each ISO week. */
export const WEEKLY_COIN_ALLOWANCE = 10

const STORAGE_KEY = "wordclimb-coins"

type CoinStore = { balance: number; week: string }

/**
 * The ISO-8601 week a date falls in, as "2026-W35".
 *
 * Mirrored by ISOWeekID in server/wordclimb/internal/domain/coins.go, and the
 * two are pinned to the same vectors in their tests. If they disagree, a player
 * gets their weekly refill twice or not at all, at the year boundary where
 * "week 1" and "the first week of January" are not the same thing.
 *
 * The rule is the Thursday one: a week belongs to the year containing its
 * Thursday. Counting from January 1st instead is the classic way to get the
 * last days of December wrong.
 */
export function isoWeekId(date: Date): string {
  // Work in UTC so a device's timezone cannot shift the week boundary.
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
  // getUTCDay() is 0 for Sunday; ISO counts Monday as 1 and Sunday as 7.
  const dayNumber = d.getUTCDay() || 7
  // Step to the Thursday of this week: that is what names the year.
  d.setUTCDate(d.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
}

function read(): CoinStore | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as CoinStore
    if (typeof data?.balance !== "number" || typeof data?.week !== "string") {
      return null
    }
    return data
  } catch {
    return null
  }
}

function write(store: CoinStore): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Storage full or unavailable. Losing the balance is bad; refusing to let
    // the player take a hint over it would be worse.
  }
}

/**
 * The player's coins, topping them up if a new week has started.
 *
 * The refill is `max(balance, allowance)`, not `balance + allowance`: coins do
 * not accumulate week over week, so someone coming back after a month finds
 * ten waiting rather than forty. The top-up happens locally as well as on the
 * server, so a player who never reconnects still gets their weekly coins.
 */
export function getCoinBalance(now: Date = new Date()): number {
  const week = isoWeekId(now)
  const store = read()

  if (!store) {
    write({ balance: WEEKLY_COIN_ALLOWANCE, week })
    return WEEKLY_COIN_ALLOWANCE
  }
  if (store.week !== week) {
    const balance = Math.max(store.balance, WEEKLY_COIN_ALLOWANCE)
    write({ balance, week })
    return balance
  }
  return store.balance
}

/** Whether a hint is affordable right now. */
export function canAfford(cost: number, now: Date = new Date()): boolean {
  return getCoinBalance(now) >= cost
}

/**
 * Spends coins, or refuses if there are not enough.
 *
 * Returns false rather than throwing or going negative: the caller's job is
 * simply not to grant the hint.
 */
export function spendCoins(cost: number, now: Date = new Date()): boolean {
  const balance = getCoinBalance(now)
  if (balance < cost) return false
  write({ balance: balance - cost, week: isoWeekId(now) })
  return true
}

/**
 * Takes the server's balance as the truth.
 *
 * Always overwrites, including upwards. Coins spent offline are reported to the
 * server when the level is banked, so a number that arrives after that already
 * accounts for them; a number that arrives before simply undoes an optimistic
 * local spend, which is the safe direction to be wrong in.
 */
export function reconcileCoins(serverBalance: number, now: Date = new Date()): void {
  write({ balance: Math.max(0, serverBalance), week: isoWeekId(now) })
}
