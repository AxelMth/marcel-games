package repositories

import (
	"context"
	"marcel-games-backend/db"
	"time"
)

// GetLevelOfTheDayCountryCodes returns the country codes for today's level
func GetLevelOfTheDayCountryCodes(ctx context.Context) []string {
	// Get today's date at midnight UTC
	now := time.Now().UTC()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	todayEnd := todayStart.Add(24 * time.Hour)

	levelOfTheDay, err := db.Client().LevelOfTheDay.FindFirst(
		db.LevelOfTheDay.Date.Gte(todayStart),
		db.LevelOfTheDay.Date.Lt(todayEnd),
	).Exec(ctx)

	if err != nil {
		return []string{}
	}
	return levelOfTheDay.CountryCodes
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
