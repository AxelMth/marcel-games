package repositories

import (
	"context"
	"log"
	"marcel-games-backend/db"
	"marcel-games-backend/pkg/utils"
	"time"
)

// GetLevelOfTheDayCountryCodes returns the country codes for today's level,
// creating the level first if nothing has been stored for today.
//
// The daily cron is the normal writer. When it stops running — as it did
// between May and August 2026 — this used to return an empty list, which the
// client could not tell apart from "you already finished today" and turned
// into a level with nothing to find, won the instant it opened. Rebuilding the
// day here keeps the mode playable no matter the state of the cron, and
// because the set is derived from the date it matches what the cron would have
// written.
func GetLevelOfTheDayCountryCodes(ctx context.Context) []string {
	// Get today's date at midnight UTC
	now := time.Now().UTC()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	todayEnd := todayStart.Add(24 * time.Hour)

	levelOfTheDay, err := db.Client().LevelOfTheDay.FindFirst(
		db.LevelOfTheDay.Date.Gte(todayStart),
		db.LevelOfTheDay.Date.Lt(todayEnd),
	).Exec(ctx)

	if err == nil && levelOfTheDay != nil && len(levelOfTheDay.CountryCodes) > 0 {
		return levelOfTheDay.CountryCodes
	}

	countryCodes := utils.DailyLevelCountryCodes(todayStart)

	// Two instances racing here both write the same date and the same codes,
	// so a duplicate row is harmless. Failing to persist is harmless too: the
	// player still gets today's puzzle, and the next call regenerates it
	// identically.
	if _, createErr := CreateLevelOfTheDay(ctx, todayStart, countryCodes); createErr != nil {
		log.Printf("level of the day: could not persist %s: %v", todayStart.Format("2006-01-02"), createErr)
	}

	return countryCodes
}

// HasUserCompletedTodaysLevel checks if the user has already completed today's level
func HasUserCompletedTodaysLevel(ctx context.Context, userID string) bool {
	// Get today's date at midnight
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	// Check if there's a level history for today's level of the day
	levelHistory, err := db.Client().LevelHistory.FindFirst(
		db.LevelHistory.UserID.Equals(userID),
		db.LevelHistory.GameMode.Equals(db.GameMode("LEVEL_OF_THE_DAY")),
		db.LevelHistory.CreatedAt.Gte(today),
		db.LevelHistory.CreatedAt.Lt(today.Add(24*time.Hour)),
	).Exec(ctx)

	return err == nil && levelHistory != nil
}

// CreateLevelOfTheDay creates a new level of the day entry
func CreateLevelOfTheDay(ctx context.Context, date time.Time, countryCodes []string) (*db.LevelOfTheDayModel, error) {
	return db.Client().LevelOfTheDay.CreateOne(
		db.LevelOfTheDay.Date.Set(date),
		db.LevelOfTheDay.CountryCodes.Set(countryCodes),
	).Exec(ctx)
}
