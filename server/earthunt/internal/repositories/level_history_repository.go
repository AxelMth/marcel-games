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

func GetLastLevelFromHistory(
	ctx context.Context,
	userID string,
	gameMode string,
	continent string,
) int {
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

// GetUserDailyLevelCount returns the number of daily levels completed by a user
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

// GetUserRankForLastDailyLevel returns the user's rank for the most recent daily level
func GetUserRankForLastDailyLevel(ctx context.Context, userID string) (int, error) {
	userLastLevel, err := db.Client().LevelHistory.FindFirst(
		db.LevelHistory.UserID.Equals(userID),
		db.LevelHistory.GameMode.Equals(db.GameMode(dailyGameMode)),
	).OrderBy(
		db.LevelHistory.CreatedAt.Order(db.DESC),
	).Exec(ctx)
	if err != nil {
		return 0, err
	}

	from, to := dayBounds(userLastLevel.CreatedAt)
	better, err := countBetterPlayers(
		ctx, dailyGameMode, from, to,
		userLastLevel.TimeSpent, userLastLevel.Attempts,
	)
	if err != nil {
		return 0, err
	}
	return rankAmong(better), nil
}

// DailyLevelStats holds statistics for a daily level
type DailyLevelStats struct {
	Date      time.Time
	Rank      int
	Attempts  int
	TimeSpent int
}

// GetUserGlobalDailyRank calculates the user's global rank based on all daily levels
func GetUserGlobalDailyRank(ctx context.Context, userID string) (int, error) {
	better, err := countBetterGlobally(ctx, userID)
	if err != nil {
		return 0, err
	}
	// Un joueur sans aucun défi du jour n'apparaît pas dans l'agrégat : la
	// requête ne rend aucune ligne, et il vaut mieux le dire « non classé » que
	// lui donner la première place par défaut.
	played, err := db.Client().LevelHistory.FindFirst(
		db.LevelHistory.UserID.Equals(userID),
		db.LevelHistory.GameMode.Equals(db.GameMode(dailyGameMode)),
	).Exec(ctx)
	if err != nil || played == nil {
		return 0, nil
	}
	return rankAmong(better), nil
}

// GameHistoryEntry holds a single level history record for the profile API
type GameHistoryEntry struct {
	Level     int    `json:"level"`
	GameMode  string `json:"gameMode"`
	Continent string `json:"continent"`
	Stars     int    `json:"stars"`
	Rank      int    `json:"rank"`
}

func getRankForLevelEntry(ctx context.Context, h db.LevelHistoryModel) (int, error) {
	// Le défi du jour se compare à la journée, les autres modes au niveau : deux
	// joueurs n'ont joué le même défi que s'ils l'ont joué le même jour, alors
	// que le niveau 12 du mode monde est le même pour tout le monde.
	if string(h.GameMode) == dailyGameMode {
		from, to := dayBounds(h.CreatedAt)
		better, err := countBetterPlayers(ctx, dailyGameMode, from, to, h.TimeSpent, h.Attempts)
		if err != nil {
			return 0, err
		}
		return rankAmong(better), nil
	}

	better, err := countBetterOnLevel(ctx, string(h.GameMode), string(h.Continent), h.Level, h.TimeSpent, h.Attempts)
	if err != nil {
		return 0, err
	}
	return rankAmong(better), nil
}

// GetUserLevelHistory returns recent level history for a user, ordered by createdAt DESC
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
