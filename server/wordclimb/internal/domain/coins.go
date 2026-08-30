package domain

import (
	"fmt"
	"time"
)

// Hint currency.
//
// Hints used to be free and unlimited, which made "reveal the whole word" the
// cheapest route through a level. Coins ration how many hints a player may
// take; the star penalty in ComputeStars is unchanged and still says how well
// they played without them. Paying for a hint buys the answer, not the score.
//
// The server owns the balance. The client mirrors it in localStorage so the
// game stays playable offline, and reports what it spent when a level is
// banked.
const (
	// WeeklyCoinAllowance is granted at the start of each ISO week.
	WeeklyCoinAllowance = 10

	// MaxCoinsPerRung bounds what a single rung may cost: first letter (1) +
	// definition (1) + full word (3). Each is charged at most once per rung —
	// the client guards repeat purchases, and this is the server-side ceiling
	// that holds whether or not it does.
	MaxCoinsPerRung = 5
)

// MaxCoinsForLadder bounds what a whole level may report spending.
//
// It has to scale with the ladder, because a level's spend accumulates over
// every rung: catalogue ladders run from 2 to 9 rungs, so a legitimate level
// can report anywhere up to 45. A flat per-rung ceiling here was worse than no
// ceiling at all — the server clamped a real 9-coin spend down to 5, replied
// with a balance higher than the player's own, and the client's reconcile
// handed the difference back. Hints ended up costing 5 a level however many
// were bought.
func MaxCoinsForLadder(rungs int) int {
	if rungs < 1 {
		rungs = 1
	}
	return MaxCoinsPerRung * rungs
}

// ISOWeekID names the ISO-8601 week a moment falls in, as "2026-W35".
//
// Mirrored by isoWeekId in apps/wordclimb/lib/coins.ts, and the two are pinned
// to the same vectors in their tests. If they disagree, a player is refilled
// twice or not at all around the new year, where "week 1" and "the first week
// of January" are not the same thing.
func ISOWeekID(t time.Time) string {
	// UTC so the player's timezone cannot shift the week boundary. Go's
	// ISOWeek already applies the Thursday rule, including the year: 31
	// December 2025 reports 2026-W01.
	year, week := t.UTC().ISOWeek()
	return fmt.Sprintf("%04d-W%02d", year, week)
}

// RefillCoins tops a balance up if a new ISO week has started, and reports the
// week the balance now belongs to.
//
// The refill is max(balance, allowance) rather than balance+allowance: coins do
// not accumulate, so a player returning after a month finds ten waiting rather
// than forty, and one who has hoarded more than the allowance keeps them.
func RefillCoins(balance int, storedWeek string, now time.Time) (int, string) {
	week := ISOWeekID(now)
	if storedWeek == week {
		return balance, week
	}
	if balance < WeeklyCoinAllowance {
		balance = WeeklyCoinAllowance
	}
	return balance, week
}

// DebitCoins subtracts what a finished level reported spending, bounded by
// what that level could plausibly have cost.
//
// Clamped at both ends, because the amount comes from the client: a negative
// would mint coins, and an absurd one would zero an account. `limit` is the
// ceiling for the ladder actually solved — see MaxCoinsForLadder. A balance
// never goes negative either: spends made offline are only reported when the
// level is banked, by which time the server may have refilled, and a player
// must not land in debt through a race they cannot see.
func DebitCoins(balance, spent, limit int) int {
	if spent < 0 {
		spent = 0
	}
	if limit < 0 {
		limit = 0
	}
	if spent > limit {
		spent = limit
	}
	if balance-spent < 0 {
		return 0
	}
	return balance - spent
}
