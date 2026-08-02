package utils

import (
	"testing"
)

func Test_CountryCodesAreReturned(t *testing.T) {
	result := GetLevelCountryCodesForLevel(1000)

	if len(result) == 0 {
		t.Fatal("Expected at least one country code, but got none")
	}

	for _, code := range result {
		if len(code) != 3 {
			t.Errorf("Expected an ISO-3 country code, but %q is %d characters long", code, len(code))
		}
	}
}

func Test_CountryCodesAreUnique(t *testing.T) {
	for _, level := range []int{15, 100, 500, 1000} {
		result := GetLevelCountryCodesForLevel(level)
		seen := make(map[string]bool, len(result))
		for _, code := range result {
			if seen[code] {
				t.Errorf("level %d returned duplicate country code %q", level, code)
			}
			seen[code] = true
		}
	}
}

func Test_HardLevelsDrawFromAWiderPool(t *testing.T) {
	// The window grows with the level, so obscure countries only appear later.
	// Sampling repeatedly makes the widening observable without asserting on a
	// specific random draw.
	seenEasy := make(map[string]bool)
	seenHard := make(map[string]bool)
	for i := 0; i < 50; i++ {
		for _, code := range GetLevelCountryCodesForLevel(15) {
			seenEasy[code] = true
		}
		for _, code := range GetLevelCountryCodesForLevel(1000) {
			seenHard[code] = true
		}
	}

	if len(seenHard) <= len(seenEasy) {
		t.Errorf(
			"Expected level 1000 to draw from a wider pool than level 15, but saw %d distinct countries vs %d",
			len(seenHard), len(seenEasy),
		)
	}
}

func Test_CorrectNumberOfCountriesAreReturned(t *testing.T) {
	// The previous version of these assertions used `<min && >max`, which can
	// never be true — a value cannot be below the minimum and above the maximum
	// at once, so every one of them passed regardless of the result.
	cases := []struct {
		level int
		min   int
		max   int
	}{
		{level: 15, min: 1, max: 1},
		{level: 30, min: 1, max: 3},
		{level: 50, min: 2, max: 4},
		{level: 100, min: 2, max: 5},
		{level: 250, min: 5, max: 10},
		{level: 500, min: 8, max: 16},
		{level: 1000, min: 12, max: 15},
	}

	// Both the count and the selection are drawn with math/rand, so a single
	// call only samples one point of the range. Repeat to actually exercise it.
	for _, tc := range cases {
		for i := 0; i < 100; i++ {
			result := GetLevelCountryCodesForLevel(tc.level)
			if len(result) < tc.min || len(result) > tc.max {
				t.Fatalf(
					"level %d: expected between %d and %d countries, but got %d",
					tc.level, tc.min, tc.max, len(result),
				)
			}
		}
	}
}
