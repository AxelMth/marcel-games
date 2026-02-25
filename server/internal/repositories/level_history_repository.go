package repositories

import (
	"context"
	"marcel-games-backend/db"
	"marcel-games-backend/internal/domain"
	"time"
)

func CreateOneLevelHistory(
	ctx context.Context,
	userID string,
	level int,
	attempts int,
	timeSpent int,
	hintsUsed int,
	gameMode string,
	continent string,
	countryCodes []string,
) (*db.LevelHistoryModel, error) {
	if continent == "" {
		continent = "WORLD"
	}
	levelHistory, err := db.Client().LevelHistory.CreateOne(
		db.LevelHistory.Level.Set(level),
		db.LevelHistory.Attempts.Set(attempts),
		db.LevelHistory.TimeSpent.Set(timeSpent),
		db.LevelHistory.User.Link(db.User.ID.Equals(userID)),
		db.LevelHistory.GameMode.Set(db.GameMode(gameMode)),
		db.LevelHistory.Continent.Set(db.Continent(continent)),
		db.LevelHistory.CountryCodes.Set(countryCodes),
		db.LevelHistory.HintsUsed.Set(hintsUsed),
	).Exec(ctx)
	return levelHistory, err
}

func GetLastLevelFromHistory(ctx context.Context, userID string, gameMode string, continent string) int {
	levelHistory, err := db.Client().LevelHistory.FindFirst(
		db.LevelHistory.UserID.Equals(userID),
		db.LevelHistory.GameMode.Equals(db.GameMode(gameMode)),
		db.LevelHistory.Continent.Equals(db.Continent(continent)),
	).OrderBy(
		db.LevelHistory.Level.Order(db.DESC),
	).Exec(ctx)
	if err != nil {
		return 0
	}
	return levelHistory.Level
}

// GetUserDailyLevelCount returns the number of daily levels completed by a user.
func GetUserDailyLevelCount(ctx context.Context, userID string) int {
	count, err := db.Client().LevelHistory.FindMany(
		db.LevelHistory.UserID.Equals(userID),
		db.LevelHistory.GameMode.Equals(db.GameMode("LEVEL_OF_THE_DAY")),
	).Exec(ctx)
	if err != nil {
		return 0
	}
	return len(count)
}

// GetUserRankForLastDailyLevel returns the user's rank for the most recent daily level.
func GetUserRankForLastDailyLevel(ctx context.Context, userID string) (int, error) {
	userLastLevel, err := db.Client().LevelHistory.FindFirst(
		db.LevelHistory.UserID.Equals(userID),
		db.LevelHistory.GameMode.Equals(db.GameMode("LEVEL_OF_THE_DAY")),
	).OrderBy(
		db.LevelHistory.CreatedAt.Order(db.DESC),
	).Exec(ctx)
	if err != nil {
		return 0, err
	}

	levelDate := userLastLevel.CreatedAt
	dayStart := time.Date(levelDate.Year(), levelDate.Month(), levelDate.Day(), 0, 0, 0, 0, levelDate.Location())
	dayEnd := dayStart.Add(24 * time.Hour)

	fewerAttempts, err := db.Client().LevelHistory.FindMany(
		db.LevelHistory.GameMode.Equals(db.GameMode("LEVEL_OF_THE_DAY")),
		db.LevelHistory.CreatedAt.Gte(dayStart),
		db.LevelHistory.CreatedAt.Lt(dayEnd),
		db.LevelHistory.Attempts.Lt(userLastLevel.Attempts),
	).Exec(ctx)
	if err != nil {
		return 0, err
	}

	sameAttemptsLessTime, err := db.Client().LevelHistory.FindMany(
		db.LevelHistory.GameMode.Equals(db.GameMode("LEVEL_OF_THE_DAY")),
		db.LevelHistory.CreatedAt.Gte(dayStart),
		db.LevelHistory.CreatedAt.Lt(dayEnd),
		db.LevelHistory.Attempts.Equals(userLastLevel.Attempts),
		db.LevelHistory.TimeSpent.Lt(userLastLevel.TimeSpent),
	).Exec(ctx)
	if err != nil {
		return 0, err
	}

	betterUsersMap := make(map[string]bool)
	for _, h := range fewerAttempts {
		betterUsersMap[h.UserID] = true
	}
	for _, h := range sameAttemptsLessTime {
		betterUsersMap[h.UserID] = true
	}

	return len(betterUsersMap) + 1, nil
}

// DailyLevelStats holds statistics for a daily level.
type DailyLevelStats struct {
	Date      time.Time
	Rank      int
	Attempts  int
	TimeSpent int
}

// GetUserGlobalDailyRank calculates the user's global rank based on all daily levels.
func GetUserGlobalDailyRank(ctx context.Context, userID string) (int, error) {
	userLevels, err := db.Client().LevelHistory.FindMany(
		db.LevelHistory.UserID.Equals(userID),
		db.LevelHistory.GameMode.Equals(db.GameMode("LEVEL_OF_THE_DAY")),
	).OrderBy(
		db.LevelHistory.CreatedAt.Order(db.ASC),
	).Exec(ctx)
	if err != nil || len(userLevels) == 0 {
		return 0, err
	}

	totalScore := 0.0
	for _, level := range userLevels {
		levelDate := level.CreatedAt
		dayStart := time.Date(levelDate.Year(), levelDate.Month(), levelDate.Day(), 0, 0, 0, 0, levelDate.Location())
		dayEnd := dayStart.Add(24 * time.Hour)

		fewerAttempts, _ := db.Client().LevelHistory.FindMany(
			db.LevelHistory.GameMode.Equals(db.GameMode("LEVEL_OF_THE_DAY")),
			db.LevelHistory.CreatedAt.Gte(dayStart),
			db.LevelHistory.CreatedAt.Lt(dayEnd),
			db.LevelHistory.Attempts.Lt(level.Attempts),
		).Exec(ctx)

		sameAttemptsLessTime, _ := db.Client().LevelHistory.FindMany(
			db.LevelHistory.GameMode.Equals(db.GameMode("LEVEL_OF_THE_DAY")),
			db.LevelHistory.CreatedAt.Gte(dayStart),
			db.LevelHistory.CreatedAt.Lt(dayEnd),
			db.LevelHistory.Attempts.Equals(level.Attempts),
			db.LevelHistory.TimeSpent.Lt(level.TimeSpent),
		).Exec(ctx)

		betterUsersMap := make(map[string]bool)
		for _, h := range fewerAttempts {
			betterUsersMap[h.UserID] = true
		}
		for _, h := range sameAttemptsLessTime {
			betterUsersMap[h.UserID] = true
		}
		totalScore += float64(len(betterUsersMap) + 1)
	}

	avgRank := totalScore / float64(len(userLevels))

	allUsers, _ := db.Client().User.FindMany().Exec(ctx)
	betterUsersCount := 0
	for _, otherUser := range allUsers {
		if otherUser.ID == userID {
			continue
		}
		otherUserLevels, _ := db.Client().LevelHistory.FindMany(
			db.LevelHistory.UserID.Equals(otherUser.ID),
			db.LevelHistory.GameMode.Equals(db.GameMode("LEVEL_OF_THE_DAY")),
		).Exec(ctx)
		if len(otherUserLevels) == 0 {
			continue
		}
		otherTotalScore := 0.0
		for _, level := range otherUserLevels {
			levelDate := level.CreatedAt
			dayStart := time.Date(levelDate.Year(), levelDate.Month(), levelDate.Day(), 0, 0, 0, 0, levelDate.Location())
			dayEnd := dayStart.Add(24 * time.Hour)

			fewerAttempts, _ := db.Client().LevelHistory.FindMany(
				db.LevelHistory.GameMode.Equals(db.GameMode("LEVEL_OF_THE_DAY")),
				db.LevelHistory.CreatedAt.Gte(dayStart),
				db.LevelHistory.CreatedAt.Lt(dayEnd),
				db.LevelHistory.Attempts.Lt(level.Attempts),
			).Exec(ctx)
			sameAttemptsLessTime, _ := db.Client().LevelHistory.FindMany(
				db.LevelHistory.GameMode.Equals(db.GameMode("LEVEL_OF_THE_DAY")),
				db.LevelHistory.CreatedAt.Gte(dayStart),
				db.LevelHistory.CreatedAt.Lt(dayEnd),
				db.LevelHistory.Attempts.Equals(level.Attempts),
				db.LevelHistory.TimeSpent.Lt(level.TimeSpent),
			).Exec(ctx)

			betterUsersMap := make(map[string]bool)
			for _, h := range fewerAttempts {
				betterUsersMap[h.UserID] = true
			}
			for _, h := range sameAttemptsLessTime {
				betterUsersMap[h.UserID] = true
			}
			otherTotalScore += float64(len(betterUsersMap) + 1)
		}
		otherAvgRank := otherTotalScore / float64(len(otherUserLevels))
		if len(otherUserLevels) > len(userLevels) ||
			(len(otherUserLevels) == len(userLevels) && otherAvgRank < avgRank) {
			betterUsersCount++
		}
	}

	return betterUsersCount + 1, nil
}

// GameHistoryEntry holds a single level history record for the profile API.
type GameHistoryEntry struct {
	Level     int    `json:"level"`
	GameMode  string `json:"gameMode"`
	Continent string `json:"continent"`
	Stars     int    `json:"stars"`
	Rank      int    `json:"rank"`
}

func getRankForLevelEntry(ctx context.Context, h db.LevelHistoryModel) (int, error) {
	var dayStart, dayEnd time.Time
	if string(h.GameMode) == "LEVEL_OF_THE_DAY" {
		levelDate := h.CreatedAt
		dayStart = time.Date(levelDate.Year(), levelDate.Month(), levelDate.Day(), 0, 0, 0, 0, levelDate.Location())
		dayEnd = dayStart.Add(24 * time.Hour)
	}

	var fewerAttempts, sameAttemptsLessTime []db.LevelHistoryModel
	var err error

	if string(h.GameMode) == "LEVEL_OF_THE_DAY" {
		fewerAttempts, err = db.Client().LevelHistory.FindMany(
			db.LevelHistory.GameMode.Equals(db.GameMode("LEVEL_OF_THE_DAY")),
			db.LevelHistory.CreatedAt.Gte(dayStart),
			db.LevelHistory.CreatedAt.Lt(dayEnd),
			db.LevelHistory.Attempts.Lt(h.Attempts),
		).Exec(ctx)
		if err != nil {
			return 0, err
		}
		sameAttemptsLessTime, err = db.Client().LevelHistory.FindMany(
			db.LevelHistory.GameMode.Equals(db.GameMode("LEVEL_OF_THE_DAY")),
			db.LevelHistory.CreatedAt.Gte(dayStart),
			db.LevelHistory.CreatedAt.Lt(dayEnd),
			db.LevelHistory.Attempts.Equals(h.Attempts),
			db.LevelHistory.TimeSpent.Lt(h.TimeSpent),
		).Exec(ctx)
	} else {
		fewerAttempts, err = db.Client().LevelHistory.FindMany(
			db.LevelHistory.Level.Equals(h.Level),
			db.LevelHistory.GameMode.Equals(h.GameMode),
			db.LevelHistory.Continent.Equals(h.Continent),
			db.LevelHistory.Attempts.Lt(h.Attempts),
		).Exec(ctx)
		if err != nil {
			return 0, err
		}
		sameAttemptsLessTime, err = db.Client().LevelHistory.FindMany(
			db.LevelHistory.Level.Equals(h.Level),
			db.LevelHistory.GameMode.Equals(h.GameMode),
			db.LevelHistory.Continent.Equals(h.Continent),
			db.LevelHistory.Attempts.Equals(h.Attempts),
			db.LevelHistory.TimeSpent.Lt(h.TimeSpent),
		).Exec(ctx)
	}
	if err != nil {
		return 0, err
	}

	betterUsersMap := make(map[string]bool)
	for _, history := range fewerAttempts {
		betterUsersMap[history.UserID] = true
	}
	for _, history := range sameAttemptsLessTime {
		betterUsersMap[history.UserID] = true
	}
	return len(betterUsersMap) + 1, nil
}

// GetUserLevelHistory returns recent level history for a user, ordered by createdAt DESC.
func GetUserLevelHistory(ctx context.Context, userID string, limit int) ([]GameHistoryEntry, error) {
	if limit <= 0 {
		limit = 50
	}
	allHistories, err := db.Client().LevelHistory.FindMany(
		db.LevelHistory.UserID.Equals(userID),
	).OrderBy(
		db.LevelHistory.CreatedAt.Order(db.DESC),
	).Exec(ctx)
	if err != nil {
		return nil, err
	}
	entries := make([]GameHistoryEntry, 0, len(allHistories))
	for i, h := range allHistories {
		if limit > 0 && i >= limit {
			break
		}
		countryCount := len(h.CountryCodes)
		if countryCount == 0 {
			countryCount = 1
		}
		stars := domain.ComputeStars(h.Attempts, countryCount, h.HintsUsed)
		rank, _ := getRankForLevelEntry(ctx, h)
		entries = append(entries, GameHistoryEntry{
			Level:     h.Level,
			GameMode:  string(h.GameMode),
			Continent: string(h.Continent),
			Stars:     stars,
			Rank:      rank,
		})
	}
	return entries, nil
}
