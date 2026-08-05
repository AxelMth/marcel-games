package utils

import (
	"testing"
	"time"
)

// The server must pick the same daily puzzle as the client, which hashes the
// YYYY-MM-DD string in apps/wordclimb/lib/game-store.ts (getDailyLevelIndex).
// These indices were computed with that JavaScript algorithm.
func Test_DailyLevelIndexMatchesTheClientHash(t *testing.T) {
	tests := []struct {
		date     string
		expected int
	}{
		{"2026-08-02", 8},
		{"2026-01-01", 0},
		{"2025-12-31", 4},
		{"2024-02-29", 6},
	}

	for _, tc := range tests {
		date, err := time.Parse("2006-01-02", tc.date)
		if err != nil {
			t.Fatalf("Invalid test date %q: %v", tc.date, err)
		}

		result := DailyLevelIndex(date, 15)
		if result != tc.expected {
			t.Errorf("Expected index %d for %s, but got %d", tc.expected, tc.date, result)
		}
	}
}

func Test_DailyLevelIndexIsStableAcrossTheDay(t *testing.T) {
	date := time.Date(2026, time.August, 2, 0, 0, 0, 0, time.UTC)

	first := DailyLevelIndex(date, 1440)
	later := DailyLevelIndex(date.Add(23*time.Hour), 1440)

	if first != later {
		t.Errorf("Expected the same level all day, but got indices %d and %d", first, later)
	}
}

// A device an hour ahead of UTC must not get tomorrow's puzzle: both sides
// format the date in UTC, so the zone the time carries is irrelevant.
func Test_DailyLevelIndexIgnoresTheZone(t *testing.T) {
	utcMorning := time.Date(2026, time.August, 2, 8, 0, 0, 0, time.UTC)
	sameInstantInParis := utcMorning.In(time.FixedZone("CEST", 2*60*60))

	if got, want := DailyLevelIndex(sameInstantInParis, 1440), DailyLevelIndex(utcMorning, 1440); got != want {
		t.Errorf("Expected the zone not to change the puzzle, but got %d and %d", got, want)
	}
}

// Late-evening UTC still belongs to today. This is the case that used to be
// wrong, when the client hashed its own local date.
func Test_DailyLevelIndexUsesTheUTCDay(t *testing.T) {
	lateUTC := time.Date(2026, time.August, 2, 23, 30, 0, 0, time.UTC)
	earlyUTC := time.Date(2026, time.August, 2, 0, 30, 0, 0, time.UTC)

	if got, want := DailyLevelIndex(lateUTC, 1440), DailyLevelIndex(earlyUTC, 1440); got != want {
		t.Errorf("Expected one puzzle for the whole UTC day, but got %d and %d", got, want)
	}
}

func Test_LevelNumberToIndexCyclesThroughTheCatalogue(t *testing.T) {
	const count = 1440

	if got := LevelNumberToIndex(1, count); got != 0 {
		t.Errorf("Expected level 1 to be index 0, but got %d", got)
	}
	if got := LevelNumberToIndex(count, count); got != count-1 {
		t.Errorf("Expected level %d to be the last index, but got %d", count, got)
	}
	// One full cycle later, the same puzzle comes back.
	if got := LevelNumberToIndex(count+1, count); got != 0 {
		t.Errorf("Expected level %d to wrap back to index 0, but got %d", count+1, got)
	}
}

func Test_LevelNumberToIndexClampsNonPositiveLevels(t *testing.T) {
	for _, level := range []int{0, -1, -42} {
		if got := LevelNumberToIndex(level, 1440); got != 0 {
			t.Errorf("Expected level %d to clamp to index 0, but got %d", level, got)
		}
	}
}

// An empty catalogue must not panic with a division by zero; callers check the
// count themselves and surface an empty payload.
func Test_IndexHelpersSurviveAnEmptyCatalogue(t *testing.T) {
	if got := LevelNumberToIndex(3, 0); got != 0 {
		t.Errorf("Expected index 0 for an empty catalogue, but got %d", got)
	}
	if got := DailyLevelIndex(time.Now(), 0); got != 0 {
		t.Errorf("Expected index 0 for an empty catalogue, but got %d", got)
	}
}
