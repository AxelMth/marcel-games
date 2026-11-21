/**
 * The coin wallet both games share: a weekly allowance, coins earned by
 * playing, and no purchase.
 */

/** Free coins granted at the start of each ISO week. */
export const WEEKLY_COIN_ALLOWANCE = 10

export interface Wallet {
  balance: number
  /** ISO week of the last weekly top-up, as "2026-W35". */
  week: string
}

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

/**
 * The wallet as it stands at `now`: a first wallet for a new player, or the
 * stored one topped up if a new week has started.
 *
 * The top-up is `max(balance, allowance)`, not `balance + allowance`: the
 * weekly coins do not pile up, so someone coming back after a month finds ten
 * waiting rather than forty. Coins earned by playing are kept either way.
 */
export function openWallet(stored: Wallet | null, now: Date): Wallet {
  const week = isoWeekId(now)
  if (!stored) return { balance: WEEKLY_COIN_ALLOWANCE, week }
  if (stored.week === week) return stored
  return { balance: Math.max(stored.balance, WEEKLY_COIN_ALLOWANCE), week }
}

/** The wallet after paying `cost`, or null when it cannot cover it. */
export function spendCoins(wallet: Wallet, cost: number): Wallet | null {
  if (cost > wallet.balance) return null
  return { ...wallet, balance: wallet.balance - cost }
}

/** Coins earned for finishing a level for the first time: one per star. */
export function rewardForStars(wallet: Wallet, stars: number): Wallet {
  return { ...wallet, balance: wallet.balance + stars }
}
