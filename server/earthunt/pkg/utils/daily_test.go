package utils

import (
	"testing"
	"time"
)

// The bug this guards against: with no row in the table the API answered with
// an empty list, and the client turned that into a level with nothing to find,
// won the moment it opened.
func TestDailyLevelCountryCodesIsNeverEmpty(t *testing.T) {
	day := time.Date(2026, time.August, 3, 0, 0, 0, 0, time.UTC)

	for i := 0; i < 400; i++ {
		codes := DailyLevelCountryCodes(day.AddDate(0, 0, i))
		if len(codes) == 0 {
			t.Fatalf("no countries for %s", day.AddDate(0, 0, i).Format("2006-01-02"))
		}
	}
}

// Regenerating a day must reproduce it exactly, otherwise a player who loaded
// the puzzle before it was persisted would be scored against a different one.
func TestDailyLevelCountryCodesIsStablePerDay(t *testing.T) {
	day := time.Date(2026, time.August, 3, 0, 0, 0, 0, time.UTC)

	first := DailyLevelCountryCodes(day)
	second := DailyLevelCountryCodes(day)

	if len(first) != len(second) {
		t.Fatalf("same day gave %d then %d countries", len(first), len(second))
	}
	for i := range first {
		if first[i] != second[i] {
			t.Fatalf("same day diverged at %d: %q vs %q", i, first[i], second[i])
		}
	}
}

// The API looks today's row up in UTC, so the seed has to ignore both the
// clock time and the location it is expressed in.
func TestDailyLevelCountryCodesIgnoresTimeAndZone(t *testing.T) {
	midnightUTC := time.Date(2026, time.August, 3, 0, 0, 0, 0, time.UTC)
	lateSameDay := time.Date(2026, time.August, 3, 23, 30, 0, 0, time.UTC)
	// 01:00 in UTC+2 is still 23:00 on 2 August in UTC — a different day, and
	// it must be treated as one.
	otherZone := time.Date(2026, time.August, 3, 1, 0, 0, 0, time.FixedZone("UTC+2", 2*60*60))

	same := DailyLevelCountryCodes(midnightUTC)
	if got := DailyLevelCountryCodes(lateSameDay); !equal(got, same) {
		t.Errorf("time of day changed the puzzle: %v vs %v", got, same)
	}
	if got := DailyLevelCountryCodes(otherZone); equal(got, same) {
		t.Error("2 August UTC produced the same puzzle as 3 August UTC")
	}
}

// Two consecutive days sharing a puzzle would make the daily pointless.
func TestDailyLevelCountryCodesVariesBetweenDays(t *testing.T) {
	day := time.Date(2026, time.August, 3, 0, 0, 0, 0, time.UTC)

	identical := 0
	for i := 0; i < 30; i++ {
		if equal(DailyLevelCountryCodes(day.AddDate(0, 0, i)), DailyLevelCountryCodes(day.AddDate(0, 0, i+1))) {
			identical++
		}
	}
	if identical > 0 {
		t.Errorf("%d consecutive day pairs shared a puzzle", identical)
	}
}

func equal(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
