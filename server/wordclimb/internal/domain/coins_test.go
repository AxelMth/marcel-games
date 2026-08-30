package domain

import (
	"testing"
	"time"
)

// The vectors here are duplicated verbatim in apps/wordclimb/lib/coins.test.ts.
// They are the contract between the two implementations of the ISO week: if
// they drift, a player is refilled twice or not at all around the new year.
func Test_ISOWeekID(t *testing.T) {
	cases := []struct {
		date string
		want string
	}{
		// A plain midweek day.
		{"2026-08-30", "2026-W35"},
		// The year boundary, which is the whole reason this is not "the week
		// number since 1 January". These days belong to the next year's W01
		// because their Thursday does.
		{"2025-12-29", "2026-W01"},
		{"2025-12-31", "2026-W01"},
		{"2026-01-01", "2026-W01"},
		// ...and these belong to the previous year's last week.
		{"2027-01-01", "2026-W53"},
		// Monday starts a week, Sunday ends the same one.
		{"2026-08-24", "2026-W35"},
		{"2026-08-23", "2026-W34"},
		// Zero-padded, so the string sorts and compares as one shape.
		{"2026-01-05", "2026-W02"},
	}

	for _, c := range cases {
		at, err := time.Parse("2006-01-02", c.date)
		if err != nil {
			t.Fatalf("bad test date %q: %v", c.date, err)
		}
		if got := ISOWeekID(at); got != c.want {
			t.Errorf("ISOWeekID(%s) = %s, want %s", c.date, got, c.want)
		}
	}
}

func Test_ISOWeekID_isTimezoneIndependent(t *testing.T) {
	// Late evening in a timezone ahead of UTC is still the UTC day, or two
	// devices would disagree about when the week turns over.
	utc := time.Date(2026, 8, 30, 23, 0, 0, 0, time.UTC)
	ahead := utc.In(time.FixedZone("UTC+10", 10*60*60))

	if ISOWeekID(utc) != ISOWeekID(ahead) {
		t.Errorf("same instant gave %s and %s", ISOWeekID(utc), ISOWeekID(ahead))
	}
}

func Test_RefillCoins(t *testing.T) {
	now := time.Date(2026, 8, 30, 12, 0, 0, 0, time.UTC)
	thisWeek := ISOWeekID(now)

	t.Run("tops a spent balance up to the allowance", func(t *testing.T) {
		balance, week := RefillCoins(3, "2026-W34", now)
		if balance != WeeklyCoinAllowance || week != thisWeek {
			t.Errorf("got %d/%s, want %d/%s", balance, week, WeeklyCoinAllowance, thisWeek)
		}
	})

	t.Run("does not accumulate week over week", func(t *testing.T) {
		// Away for a month means ten coins waiting, not forty.
		if balance, _ := RefillCoins(0, "2026-W30", now); balance != WeeklyCoinAllowance {
			t.Errorf("got %d, want %d", balance, WeeklyCoinAllowance)
		}
	})

	t.Run("leaves a balance above the allowance alone", func(t *testing.T) {
		if balance, _ := RefillCoins(15, "2026-W34", now); balance != 15 {
			t.Errorf("got %d, want 15 — a hoarded balance must not be cut", balance)
		}
	})

	t.Run("does nothing twice in the same week", func(t *testing.T) {
		if balance, _ := RefillCoins(2, thisWeek, now); balance != 2 {
			t.Errorf("got %d, want 2 — refilled twice in one week", balance)
		}
	})

	t.Run("refills an account that has never been refilled", func(t *testing.T) {
		if balance, _ := RefillCoins(0, "", now); balance != WeeklyCoinAllowance {
			t.Errorf("got %d, want %d", balance, WeeklyCoinAllowance)
		}
	})
}

func Test_MaxCoinsForLadder(t *testing.T) {
	// A level's spend accumulates over every rung, so the ceiling has to scale
	// with the ladder. A flat one was worse than none: it clamped a real spend
	// down, the server answered with a balance higher than the player's, and
	// the client's reconcile handed the difference back as free coins.
	cases := []struct {
		rungs, want int
	}{
		{1, 5},
		{2, 10},
		{5, 25},
		{9, 45},
		// Defensive: an empty or malformed ladder still allows one rung rather
		// than zero, so a legitimate single hint is not clawed back.
		{0, 5},
		{-3, 5},
	}

	for _, c := range cases {
		if got := MaxCoinsForLadder(c.rungs); got != c.want {
			t.Errorf("MaxCoinsForLadder(%d) = %d, want %d", c.rungs, got, c.want)
		}
	}
}

func Test_DebitCoins(t *testing.T) {
	cases := []struct {
		name                  string
		balance, spent, limit int
		want                  int
	}{
		{"ordinary spend", 10, 3, 25, 7},
		{"spending nothing", 10, 0, 25, 10},
		{"exactly empties", 3, 3, 25, 0},
		// A whole ladder solved on hints is a legitimate spend, and must be
		// charged in full rather than clamped — clamping refunded the rest.
		{"charges a full multi-rung spend", 30, 27, 45, 3},
		// Offline spending is only reported when the level is banked, by which
		// time the server may have reconciled: the player must not end up in
		// debt through a race they cannot see.
		{"never goes negative", 2, 3, 25, 0},
		// A tampered payload must not be able to zero an account...
		{"clamps a claim beyond what the ladder allows", 50, 999, 10, 40},
		// ...nor mint coins by spending a negative amount.
		{"refuses a negative spend", 10, -5, 25, 10},
		{"treats a negative limit as zero", 10, 4, -1, 10},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := DebitCoins(c.balance, c.spent, c.limit); got != c.want {
				t.Errorf("DebitCoins(%d, %d, %d) = %d, want %d",
					c.balance, c.spent, c.limit, got, c.want)
			}
		})
	}
}
