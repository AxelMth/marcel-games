package main

import (
	"testing"
	"time"
)

// The promise of the job is "a month of puzzles in front of the players", so
// the window has to be inclusive at both ends: today, and today+horizon.
func TestDaysToFillCoversTodayThroughHorizon(t *testing.T) {
	now := time.Date(2026, time.August, 3, 14, 30, 0, 0, time.UTC)

	days := daysToFill(now, 30)

	if len(days) != 31 {
		t.Fatalf("a 30-day horizon should cover 31 days, got %d", len(days))
	}
	if got := days[0].Format("2006-01-02"); got != "2026-08-03" {
		t.Errorf("window starts at %s, expected today", got)
	}
	if got := days[len(days)-1].Format("2006-01-02"); got != "2026-09-02" {
		t.Errorf("window ends at %s, expected today+30", got)
	}
}

// Every entry feeds a UTC range query, so a stray clock time would look up the
// wrong window and store a row the API cannot find.
func TestDaysToFillNormalisesToUTCMidnight(t *testing.T) {
	// 23:45 in UTC+2 is still 21:45 on the same day in UTC.
	now := time.Date(2026, time.August, 3, 23, 45, 0, 0, time.FixedZone("UTC+2", 2*60*60))

	for _, day := range daysToFill(now, 5) {
		h, m, s := day.Clock()
		if h != 0 || m != 0 || s != 0 {
			t.Fatalf("%s is not midnight", day.Format(time.RFC3339))
		}
		if day.Location() != time.UTC {
			t.Fatalf("%s is not in UTC", day.Format(time.RFC3339))
		}
	}
}

// Consecutive, no gaps and no repeats — a duplicate would write the same day
// twice, a gap would leave the daily challenge empty.
func TestDaysToFillIsConsecutive(t *testing.T) {
	days := daysToFill(time.Date(2026, time.December, 20, 0, 0, 0, 0, time.UTC), 40)

	for i := 1; i < len(days); i++ {
		if gap := days[i].Sub(days[i-1]); gap != 24*time.Hour {
			t.Fatalf("%s follows %s by %v, expected 24h",
				days[i].Format("2006-01-02"), days[i-1].Format("2006-01-02"), gap)
		}
	}
}

// A zero horizon is the degenerate "just fix today" run, and must still cover
// today rather than nothing at all.
func TestDaysToFillWithZeroHorizonCoversToday(t *testing.T) {
	days := daysToFill(time.Date(2026, time.August, 3, 0, 0, 0, 0, time.UTC), 0)

	if len(days) != 1 {
		t.Fatalf("expected exactly today, got %d days", len(days))
	}
	if got := days[0].Format("2006-01-02"); got != "2026-08-03" {
		t.Errorf("got %s, expected today", got)
	}
}
