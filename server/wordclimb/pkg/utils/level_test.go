package utils

import (
	"marcel-games-backend/internal/constants"
	"testing"
	"time"
)

// differsByOneLetter reports whether two words are one substitution apart,
// which is the only legal move in a ladder.
func differsByOneLetter(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	diff := 0
	for i := range a {
		if a[i] != b[i] {
			diff++
		}
	}
	return diff == 1
}

func Test_EverySeedPairProducesALevel(t *testing.T) {
	levels := AllLevels()

	if len(levels) != len(constants.LevelSeeds) {
		t.Fatalf("Expected %d levels, but got %d: some seed pair is unreachable in the dictionary",
			len(constants.LevelSeeds), len(levels))
	}
}

func Test_LaddersAreValid(t *testing.T) {
	dictionary := Dictionary()

	for _, level := range AllLevels() {
		if len(level.WordLadder) < 2 {
			t.Errorf("Level %d: expected a ladder of at least 2 words, but got %v", level.ID, level.WordLadder)
			continue
		}

		if level.WordLadder[0] != level.BeginWord {
			t.Errorf("Level %d: ladder starts with %q, but the begin word is %q",
				level.ID, level.WordLadder[0], level.BeginWord)
		}

		last := level.WordLadder[len(level.WordLadder)-1]
		if last != level.EndWord {
			t.Errorf("Level %d: ladder ends with %q, but the end word is %q", level.ID, last, level.EndWord)
		}

		for i, word := range level.WordLadder {
			if _, ok := dictionary[word]; !ok {
				t.Errorf("Level %d: word %q is not in the dictionary", level.ID, word)
			}
			if i > 0 && !differsByOneLetter(level.WordLadder[i-1], word) {
				t.Errorf("Level %d: %q -> %q is not a one-letter change",
					level.ID, level.WordLadder[i-1], word)
			}
		}
	}
}

func Test_GetLevelForNumberCyclesThroughLevels(t *testing.T) {
	total := len(AllLevels())

	first, ok := GetLevelForNumber(1)
	if !ok {
		t.Fatal("Expected a level for level number 1")
	}

	// One full cycle later, the same puzzle comes back.
	wrapped, ok := GetLevelForNumber(total + 1)
	if !ok {
		t.Fatalf("Expected a level for level number %d", total+1)
	}

	if wrapped.ID != first.ID {
		t.Errorf("Expected level %d to wrap back to level ID %d, but got %d", total+1, first.ID, wrapped.ID)
	}
}

func Test_GetLevelForNumberClampsNonPositiveLevels(t *testing.T) {
	first, _ := GetLevelForNumber(1)

	for _, level := range []int{0, -1, -42} {
		result, ok := GetLevelForNumber(level)
		if !ok {
			t.Fatalf("Expected a level for level number %d", level)
		}
		if result.ID != first.ID {
			t.Errorf("Expected level number %d to clamp to level ID %d, but got %d", level, first.ID, result.ID)
		}
	}
}

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

		result := dailyLevelIndex(date, 15)
		if result != tc.expected {
			t.Errorf("Expected index %d for %s, but got %d", tc.expected, tc.date, result)
		}
	}
}

func Test_GetLevelForDateIsStable(t *testing.T) {
	date := time.Date(2026, time.August, 2, 0, 0, 0, 0, time.UTC)

	first, ok := GetLevelForDate(date)
	if !ok {
		t.Fatal("Expected a level for the day")
	}

	// The time of day must not change the puzzle.
	later, ok := GetLevelForDate(date.Add(23 * time.Hour))
	if !ok {
		t.Fatal("Expected a level for the day")
	}

	if first.ID != later.ID {
		t.Errorf("Expected the same level all day, but got IDs %d and %d", first.ID, later.ID)
	}
}
