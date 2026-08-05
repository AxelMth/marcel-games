// Command populate-levels loads the generated level catalogue into the database.
//
// The catalogue itself is produced by
// apps/wordclimb/scripts/build-catalogue.mjs, which writes both the client's
// offline bundle and the JSON embedded here. This job is what makes the API
// serve it: until it has run, GET /level has nothing to hand out.
//
// It is idempotent — rerun it after every catalogue regeneration.
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"marcel-games-backend/db"
	"marcel-games-backend/internal/constants"
	"marcel-games-backend/internal/domain"
	"marcel-games-backend/internal/repositories"
	"marcel-games-backend/pkg/utils"
	"os"
	"sort"

	"github.com/joho/godotenv"
)

func main() {
	dryRun := flag.Bool("dry-run", false, "validate the catalogue without writing to the database")
	flag.Parse()

	catalogue, err := constants.Catalogue()
	if err != nil {
		log.Fatalf("Could not read the embedded catalogue: %v", err)
	}

	// Validate everything before opening a connection: a catalogue that no
	// longer matches its generator should cost nothing and say what is wrong.
	locales := sortedLocales(catalogue)
	for _, locale := range locales {
		if err := validateLocale(locale, catalogue[locale]); err != nil {
			log.Fatalf("Refusing to write an invalid catalogue: %v", err)
		}
		fmt.Printf("%s: %d levels validated\n", locale, len(catalogue[locale]))
	}

	if *dryRun {
		fmt.Println("Dry run: nothing written")
		return
	}

	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	if err := db.Initialize(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Disconnect()

	ctx := context.Background()

	failed := 0
	for _, locale := range locales {
		levels := catalogue[locale]

		written := 0
		for number, level := range levels {
			// Positions are 1-based and follow the generated order, which is
			// easiest first — level 1 must be the gentlest puzzle.
			err := repositories.UpsertLevel(
				ctx,
				locale,
				number+1,
				level.BeginWord,
				level.EndWord,
				level.WordLadder,
			)
			if err != nil {
				// One bad row must not abandon the rest of the catalogue.
				failed++
				log.Printf("%s level %d (%s → %s): %v", locale, number+1, level.BeginWord, level.EndWord, err)
				continue
			}
			written++
		}

		// A regenerated catalogue can be shorter than the one already stored.
		// Left in place, the extra rows would still be reachable through the
		// level wrap-around.
		removed, err := repositories.DeleteLevelsAbove(ctx, locale, len(levels))
		if err != nil {
			failed++
			log.Printf("%s: could not remove the levels past %d: %v", locale, len(levels), err)
		}

		fmt.Printf("%s: %d written, %d removed\n", locale, written, removed)
	}

	// Fail the job on any gap left behind, so a silent partial fill cannot pass
	// for a healthy run.
	if failed > 0 {
		os.Exit(1)
	}
}

// validateLocale re-checks every ladder against the game's one rule. The
// generator already rejects bad ladders, so a failure here means the catalogue
// on disk was not produced by the generator that is supposed to own it.
func validateLocale(locale string, levels []constants.CatalogueLevel) error {
	if len(levels) == 0 {
		return fmt.Errorf("locale %s has no level", locale)
	}

	for i, level := range levels {
		if err := utils.ValidateLadder(level.BeginWord, level.EndWord, level.WordLadder); err != nil {
			return fmt.Errorf("locale %s, level %d: %w", locale, i+1, err)
		}
	}
	return nil
}

// sortedLocales gives the run a stable order, so two runs log the same thing
// and a failure is reproducible.
func sortedLocales(catalogue map[string][]constants.CatalogueLevel) []string {
	locales := make([]string, 0, len(catalogue))
	for locale := range catalogue {
		// Guard against a catalogue key the database enum would reject.
		if normalized := domain.NormalizeLocale(locale); normalized == locale {
			locales = append(locales, locale)
		} else {
			log.Printf("Skipping unknown locale %q in the catalogue", locale)
		}
	}
	sort.Strings(locales)
	return locales
}
