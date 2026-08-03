package domain

import "testing"

func Test_NormalizeGameMode(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"schema value is kept", "NORMAL", GameModeNormal},
		{"random is kept", "RANDOM", GameModeRandom},
		{"daily is kept", "LEVEL_OF_THE_DAY", GameModeLevelOfTheDay},
		{"client ui mode", "daily", GameModeLevelOfTheDay},
		{"client ui mode is case insensitive", "Random", GameModeRandom},
		{"surrounding spaces are ignored", "  LEVEL_OF_THE_DAY  ", GameModeLevelOfTheDay},
		{"earthunt leftover falls back", "WORLD", GameModeNormal},
		{"continents leftover falls back", "CONTINENTS", GameModeNormal},
		{"empty falls back", "", GameModeNormal},
		{"unknown falls back", "not-a-mode", GameModeNormal},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if result := NormalizeGameMode(tc.input); result != tc.expected {
				t.Errorf("Expected %q for input %q, but got %q", tc.expected, tc.input, result)
			}
		})
	}
}
