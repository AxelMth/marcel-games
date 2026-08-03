package utils

import (
	"fmt"
	"marcel-games-backend/internal/constants"
	"testing"
)

// Both the country count and the draw window grow with the level while the pool
// does not. Oceania holds seven countries, so from level 101 the slice bound ran
// past it and the request panicked — and because FinishLevelHandler draws the
// next level after recording the finished one, the player advanced into a level
// that crashed every time they asked for it.
func TestContinentLevelsNeverPanic(t *testing.T) {
	continents := []constants.Continent{"EUROPE", "ASIA", "AMERICAS", "AFRICA", "OCEANIA"}
	levels := []int{1, 15, 16, 30, 31, 50, 51, 100, 101, 250, 251, 500, 1000, 1001, 10000}

	for _, continent := range continents {
		poolSize := len(getCountriesForContinent(continent))
		for _, level := range levels {
			t.Run(fmt.Sprintf("%s/%d", continent, level), func(t *testing.T) {
				codes := GetLevelCountryCodesForContinent(level, continent)

				if len(codes) == 0 {
					t.Fatalf("no countries drawn from a pool of %d", poolSize)
				}
				if len(codes) > poolSize {
					t.Fatalf("drew %d countries from a pool of %d", len(codes), poolSize)
				}
				assertNoDuplicates(t, codes)
			})
		}
	}
}

func TestWorldLevelsNeverPanic(t *testing.T) {
	poolSize := len(constants.Countries)

	for _, level := range []int{1, 15, 31, 100, 251, 500, 1000, 1001, 10000} {
		t.Run(fmt.Sprint(level), func(t *testing.T) {
			codes := GetLevelCountryCodesForLevel(level)

			if len(codes) == 0 {
				t.Fatal("no countries drawn")
			}
			if len(codes) > poolSize {
				t.Fatalf("drew %d countries from a pool of %d", len(codes), poolSize)
			}
			assertNoDuplicates(t, codes)
		})
	}
}

// An unknown or empty continent yields an empty pool. It must come back empty
// rather than panic; the client treats an empty level as unavailable and
// generates one locally.
//
// "WORLD" belongs here: the handler normalises world and daily requests to that
// string, and it is a value of the Prisma enum, but no country carries it as a
// continent. ANTARCTICA does not — one country, ATA, is filed under it.
func TestUnknownContinentReturnsEmpty(t *testing.T) {
	for _, continent := range []constants.Continent{"", "WORLD", "ATLANTIS", "europe"} {
		if codes := GetLevelCountryCodesForContinent(1, continent); len(codes) != 0 {
			t.Errorf("continent %q returned %v, expected nothing", continent, codes)
		}
	}
}

func assertNoDuplicates(t *testing.T, codes []string) {
	t.Helper()
	seen := make(map[string]bool, len(codes))
	for _, code := range codes {
		if seen[code] {
			t.Fatalf("%q appears twice in %v", code, codes)
		}
		seen[code] = true
	}
}
