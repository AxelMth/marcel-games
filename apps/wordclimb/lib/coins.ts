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

import { WEEKLY_COIN_ALLOWANCE, isoWeekId } from "@marcel-games/wordclimb-core"

export { HINT_COSTS, WEEKLY_COIN_ALLOWANCE, isoWeekId, type HintType } from "@marcel-games/wordclimb-core"

const STORAGE_KEY = "wordclimb-coins"

/**
 * `unreported` is what has been spent locally but not yet acknowledged by the
 * server.
 *
 * Without it the mirror was refundable. A spend only reaches the server when
 * the level is banked, and every server response overwrote the balance
 * outright — so abandoning a level after taking a hint, then returning to the
 * home screen, restored the coins: GET /progress answered with a balance that
 * had never heard of the spend. Since abandoning also leaves the level
 * unfinished, the same puzzle could be reopened and mined again. Hints were
 * free to anyone who never finished a level.
 *
 * Holding the unacknowledged amount here lets a server balance be applied
 * without undoing spends it does not yet know about.
 */
type CoinStore = { balance: number; week: string; unreported: number }

function read(): CoinStore | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as CoinStore
    if (typeof data?.balance !== "number" || typeof data?.week !== "string") {
      return null
    }
    // Absent on records written before the ledger existed: nothing was owed
    // then, so zero is the honest reading.
    return { ...data, unreported: data.unreported ?? 0 }
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
    write({ balance: WEEKLY_COIN_ALLOWANCE, week, unreported: 0 })
    return WEEKLY_COIN_ALLOWANCE
  }
  if (store.week !== week) {
    const balance = Math.max(store.balance, WEEKLY_COIN_ALLOWANCE)
    // The refill supersedes the old week's accounting on both sides, so the
    // ledger starts clean — otherwise a spend the server never heard about
    // would keep being subtracted from every refilled balance for ever.
    write({ balance, week, unreported: 0 })
    return balance
  }
  return store.balance
}

/** What has been spent locally that the server has not acknowledged yet. */
export function getUnreportedSpend(): number {
  return read()?.unreported ?? 0
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
  const store = read()
  write({
    balance: balance - cost,
    week: isoWeekId(now),
    unreported: (store?.unreported ?? 0) + cost,
  })
  return true
}

/**
 * Clears a spend the server has now applied.
 *
 * Called with the level's own `coinsSpent` once a finished level has been
 * accepted — whether banked live or replayed from the offline queue. From that
 * point the server's balance already accounts for it, so it must stop being
 * subtracted again in reconcileCoins.
 */
export function confirmReportedSpend(spent: number): void {
  const store = read()
  if (!store || spent <= 0) return
  write({ ...store, unreported: Math.max(0, store.unreported - spent) })
}

/**
 * Applies the server's balance, minus what it has not been told about yet.
 *
 * The server is authoritative, but it is also behind: spends ride along with
 * the level they were made in, so between taking a hint and banking the level
 * — or for ever, on a level the player abandons — the server's number is too
 * high. Subtracting the unacknowledged amount is what stops every trip to the
 * home screen refunding the hints just bought.
 */
export function reconcileCoins(serverBalance: number, now: Date = new Date()): void {
  const store = read()
  const unreported = store?.unreported ?? 0
  write({
    balance: Math.max(0, serverBalance - unreported),
    week: isoWeekId(now),
    unreported,
  })
}
