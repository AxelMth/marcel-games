package utils

import (
	"math/rand"
	"time"
)

// DailyLevelCountryCodes returns the country set for the level of the day.
//
// The generator is seeded from the calendar date alone, so every player gets
// the same puzzle and a given day always rebuilds to the same set. That
// property is what lets the API regenerate a day the cron never wrote without
// handing out a different puzzle than a client may already have seen.
//
// The date is normalised to midnight UTC first: the API reads today's row in
// UTC, so seeding on anything else would produce two different puzzles for the
// same day depending on the caller's clock.
func DailyLevelCountryCodes(date time.Time) []string {
	utc := date.UTC()
	day := time.Date(utc.Year(), utc.Month(), utc.Day(), 0, 0, 0, 0, time.UTC)

	// A local generator, not rand.Seed: seeding the global source would make
	// every concurrent request draw from a sequence this one just reset.
	generator := rand.New(rand.NewSource(day.Unix()))

	// Levels 1..50 keep the daily varied in difficulty without ever reaching
	// the very large sets the late world levels use.
	level := generator.Intn(50) + 1
	return GetLevelCountryCodesForLevelWithRand(level, generator)
}
