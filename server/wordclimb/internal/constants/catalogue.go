package constants

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"sync"
)

// catalogueJSON is the generated level catalogue, the same one the client
// bundles for offline play.
//
// Both files come from a single run of
// apps/wordclimb/scripts/build-catalogue.mjs, so a level number means the same
// puzzle on both sides. Regenerate with:
//
//	pnpm --filter @marcel-games/wordclimb build:catalogue
//
//go:embed catalogue.json
var catalogueJSON []byte

// CatalogueLevel is one puzzle as it appears in the generated catalogue.
// WordLadder holds the intermediate words only — the ones the player has to
// find — with the begin and end words in their own fields.
type CatalogueLevel struct {
	ID         int      `json:"id"`
	BeginWord  string   `json:"beginWord"`
	EndWord    string   `json:"endWord"`
	WordLadder []string `json:"wordLadder"`
}

var (
	catalogueOnce sync.Once
	catalogue     map[string][]CatalogueLevel
	catalogueErr  error
)

// Catalogue returns the levels of every locale, keyed by the Locale enum
// values of schema.prisma ("EN", "FR"), each ordered easiest first.
//
// It is read-only reference data used to seed the Level table; the API itself
// serves levels out of the database, not out of this map.
func Catalogue() (map[string][]CatalogueLevel, error) {
	catalogueOnce.Do(func() {
		var byLowercaseLocale map[string][]CatalogueLevel
		if err := json.Unmarshal(catalogueJSON, &byLowercaseLocale); err != nil {
			catalogueErr = fmt.Errorf("parsing the embedded catalogue: %w", err)
			return
		}

		catalogue = make(map[string][]CatalogueLevel, len(byLowercaseLocale))
		for locale, levels := range byLowercaseLocale {
			if len(levels) == 0 {
				catalogueErr = fmt.Errorf("the catalogue has no level for locale %q", locale)
				return
			}
			// The generator writes "en"/"fr"; the database enum is "EN"/"FR".
			catalogue[upperASCII(locale)] = levels
		}
	})
	return catalogue, catalogueErr
}

// upperASCII uppercases a locale key without pulling in strings for two letters.
func upperASCII(s string) string {
	out := []byte(s)
	for i, c := range out {
		if c >= 'a' && c <= 'z' {
			out[i] = c - ('a' - 'A')
		}
	}
	return string(out)
}
