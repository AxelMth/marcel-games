package constants_test

import (
	"marcel-games-backend/internal/constants"
	"marcel-games-backend/internal/domain"
	"marcel-games-backend/pkg/utils"
	"testing"
)

// The catalogue is a generated file that is committed, so nothing stops a bad
// regeneration — or a hand edit — from landing. This is the guard: every
// shipped puzzle is checked against the game's one rule at test time, long
// before the populate job would refuse it against a live database.
//
// It is the Go half of the same promise apps/wordclimb/scripts/build-catalogue.mjs
// makes when it emits the file.
func Test_EveryCatalogueLadderIsPlayable(t *testing.T) {
	for locale, levels := range loadCatalogue(t) {
		for i, level := range levels {
			if err := utils.ValidateLadder(level.BeginWord, level.EndWord, level.WordLadder); err != nil {
				t.Errorf("%s level %d (%s → %s): %v", locale, i+1, level.BeginWord, level.EndWord, err)
			}
		}
	}
}

// The plan committed to at least 100 levels per language; well below that and
// a regular player would loop back to puzzles they have already solved.
func Test_EveryLocaleHasEnoughLevels(t *testing.T) {
	const minimumLevels = 100

	catalogue := loadCatalogue(t)

	for _, locale := range []string{domain.LocaleEN, domain.LocaleFR} {
		levels, ok := catalogue[locale]
		if !ok {
			t.Errorf("The catalogue has no %s levels at all", locale)
			continue
		}
		if len(levels) < minimumLevels {
			t.Errorf("Expected at least %d %s levels, but got %d", minimumLevels, locale, len(levels))
		}
	}
}

// Keys must match the Locale enum of schema.prisma exactly, or the populate job
// writes a value the database rejects.
func Test_CatalogueKeysAreDatabaseLocales(t *testing.T) {
	catalogue := loadCatalogue(t)

	for locale := range catalogue {
		if normalized := domain.NormalizeLocale(locale); normalized != locale {
			t.Errorf("Catalogue key %q is not a Locale enum value (normalizes to %q)", locale, normalized)
		}
	}
}

// Levels are served easiest first — the level counter the player sees is a
// position in this order, so a catalogue sorted any other way would open the
// game on a hard puzzle.
func Test_CatalogueIsOrderedEasiestFirst(t *testing.T) {
	catalogue := loadCatalogue(t)

	for locale, levels := range catalogue {
		for i := 1; i < len(levels); i++ {
			if len(levels[i].WordLadder) < len(levels[i-1].WordLadder) {
				t.Fatalf("%s level %d has %d rungs, fewer than level %d's %d — the catalogue is not sorted",
					locale, i+1, len(levels[i].WordLadder), i, len(levels[i-1].WordLadder))
			}
		}
	}
}

func loadCatalogue(t *testing.T) map[string][]constants.CatalogueLevel {
	t.Helper()
	catalogue, err := constants.Catalogue()
	if err != nil {
		t.Fatalf("Could not read the embedded catalogue: %v", err)
	}
	return catalogue
}
