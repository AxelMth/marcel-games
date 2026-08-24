package handlers

import (
	"context"
	"fmt"
	"marcel-games-backend/internal/domain"
	"marcel-games-backend/internal/repositories"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type GetLevelInfo struct {
	UserID   string `form:"userId" binding:"required"`
	GameMode string `form:"gameMode" binding:"required"`
	// Optional: an absent locale means English, the app's own default.
	Locale string `form:"locale"`
}

// LevelPayload is a playable level.
//
// WordLadder holds the intermediate words only — the ones the player has to
// find — with the begin and end words in their own fields. Same convention as
// the client's Level type (apps/wordclimb/lib/data/catalogue.ts), so the puzzle
// the API serves and the puzzle the client falls back to offline have the same
// shape.
type LevelPayload struct {
	BeginWord  string   `json:"beginWord"`
	EndWord    string   `json:"endWord"`
	WordLadder []string `json:"wordLadder"`
}

type GetLevelInfoResponse struct {
	Level int `json:"level"`
	LevelPayload
	Stats *DailyLevelStats `json:"stats,omitempty"`
}

type DailyLevelStats struct {
	DailyLevelsCompleted int `json:"dailyLevelsCompleted"`
	LastLevelRank        int `json:"lastLevelRank"`
	GlobalRank           int `json:"globalRank"`
}

func GetLevelHandler(c *gin.Context) {
	var req GetLevelInfo
	if err := c.ShouldBindQuery(&req); err != nil {
		fmt.Println(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query parameters"})
		return
	}

	gameMode := domain.NormalizeGameMode(req.GameMode)
	locale := domain.NormalizeLocale(req.Locale)

	ctx := context.Background()

	var currentLevel int
	var stats *DailyLevelStats
	// Not the zero value: a bare LevelPayload has a nil WordLadder, which
	// marshals to null and breaks the promise that the client can always
	// iterate over it.
	payload := emptyLevelPayload()

	if gameMode == domain.GameModeLevelOfTheDay {
		// Level of the day is always level 1: there is a single puzzle per day.
		currentLevel = 1

		// An already-finished daily returns an empty payload so the client shows
		// the "come back tomorrow" state instead of the puzzle again.
		if !repositories.HasUserCompletedTodaysLevel(ctx, req.UserID) {
			payload = levelOfTheDayPayload(ctx, locale)
		}

		stats = buildDailyLevelStats(ctx, req.UserID)
	} else {
		// For other game modes, get the last level and increment
		level := repositories.GetLastLevelFromHistory(ctx, req.UserID, gameMode)
		currentLevel = level + 1
		payload = levelPayloadForNumber(ctx, locale, currentLevel)
	}

	response := GetLevelInfoResponse{
		Level:        currentLevel,
		LevelPayload: payload,
		Stats:        stats,
	}

	c.JSON(http.StatusOK, response)
}

type FinishLevelInfo struct {
	UserID     string   `json:"userId"`
	Attempts   int      `json:"attempts"`
	TimeSpent  int      `json:"timeSpent"`
	HintsUsed  int      `json:"hintsUsed"`
	GameMode string `json:"gameMode"`
	// The puzzle that was solved. WordLadder is the intermediate words only.
	BeginWord  string   `json:"beginWord"`
	EndWord    string   `json:"endWord"`
	WordLadder []string `json:"wordLadder"`
	// Optional: an absent locale means English, the app's own default.
	Locale string `json:"locale"`
}

type FinishLevelResponse struct {
	NextLevel      int              `json:"nextLevel"`
	NextBeginWord  string           `json:"nextBeginWord"`
	NextEndWord    string           `json:"nextEndWord"`
	NextWordLadder []string         `json:"nextWordLadder"`
	Stats          *DailyLevelStats `json:"stats,omitempty"`
}

func FinishLevelHandler(c *gin.Context) {
	var req FinishLevelInfo
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Println(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	if req.UserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	gameMode := domain.NormalizeGameMode(req.GameMode)
	locale := domain.NormalizeLocale(req.Locale)

	ctx := context.Background()

	// One daily per day, however many times it is submitted. The offline queue
	// replays results whose response was lost, and every replay used to add a
	// row — inflating the player's daily count and their rank with it.
	if gameMode == domain.GameModeLevelOfTheDay &&
		repositories.HasUserCompletedTodaysLevel(ctx, req.UserID) {
		c.JSON(http.StatusOK, FinishLevelResponse{
			NextLevel:      1,
			NextWordLadder: []string{},
			Stats:          buildDailyLevelStats(ctx, req.UserID),
		})
		return
	}

	level := repositories.GetLastLevelFromHistory(ctx, req.UserID, gameMode)

	_, err := repositories.CreateOneLevelHistory(
		ctx,
		req.UserID,
		level+1,
		req.Attempts,
		req.TimeSpent,
		req.HintsUsed,
		gameMode,
		req.BeginWord,
		req.EndWord,
		req.WordLadder,
	)

	if err != nil {
		fmt.Println("Failed to create level history", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create level history"})
		return
	}

	var nextLevel int
	var stats *DailyLevelStats
	// See GetLevelHandler: an empty payload still has to carry an empty array.
	payload := emptyLevelPayload()

	if gameMode == domain.GameModeLevelOfTheDay {
		// The daily puzzle is over until tomorrow, so there is no next level to
		// hand back.
		nextLevel = 1
		stats = buildDailyLevelStats(ctx, req.UserID)
	} else {
		nextLevel = level + 2
		payload = levelPayloadForNumber(ctx, locale, nextLevel)
	}

	response := FinishLevelResponse{
		NextLevel:      nextLevel,
		NextBeginWord:  payload.BeginWord,
		NextEndWord:    payload.EndWord,
		NextWordLadder: payload.WordLadder,
		Stats:          stats,
	}

	c.JSON(http.StatusOK, response)
}

// levelPayloadForNumber resolves the catalogue puzzle for a level number in a
// locale. An empty payload means the catalogue has not been populated for that
// language — see cmd/populate-levels.
func levelPayloadForNumber(ctx context.Context, locale string, level int) LevelPayload {
	return toLevelPayload(repositories.GetLevelForPlay(ctx, locale, level))
}

// levelOfTheDayPayload reads today's puzzle from the database and falls back to
// recomputing it from the date when the populate-level-of-the-day job has not
// run. Without the fallback a missed cron leaves the daily mode unplayable.
func levelOfTheDayPayload(ctx context.Context, locale string) LevelPayload {
	today := time.Now().UTC()

	if level := repositories.GetLevelOfTheDay(ctx, locale, today); level != nil {
		return toLevelPayload(level)
	}

	return toLevelPayload(repositories.GetDailyLevelFromCatalogue(ctx, locale, today))
}

// toLevelPayload converts a catalogue row to the wire shape, collapsing a
// missing level into the empty payload the client reads as "nothing to play".
func toLevelPayload(level *repositories.Level) LevelPayload {
	if level == nil {
		return emptyLevelPayload()
	}
	return LevelPayload{
		BeginWord:  level.BeginWord,
		EndWord:    level.EndWord,
		WordLadder: level.WordLadder,
	}
}

// emptyLevelPayload keeps wordLadder as [] rather than null on the wire, so the
// client can always iterate over it.
func emptyLevelPayload() LevelPayload {
	return LevelPayload{WordLadder: []string{}}
}

func buildDailyLevelStats(ctx context.Context, userID string) *DailyLevelStats {
	dailyLevelsCompleted := repositories.GetUserDailyLevelCount(ctx, userID)
	lastLevelRank, _ := repositories.GetUserRankForLastDailyLevel(ctx, userID)
	globalRank, _ := repositories.GetUserGlobalDailyRank(ctx, userID)

	return &DailyLevelStats{
		DailyLevelsCompleted: dailyLevelsCompleted,
		LastLevelRank:        lastLevelRank,
		GlobalRank:           globalRank,
	}
}

type GetProgressInfo struct {
	UserID string `form:"userId" binding:"required"`
}

// GetProgressResponse feeds the mode carousel.
//
// worldLevel keeps earthunt's field name because the client still reads it
// under that name (apps/wordclimb/lib/api.ts, ProgressResponse.worldLevel);
// in WordClimb it is the progression of the NORMAL mode, shown as "Classic".
type GetProgressResponse struct {
	WorldLevel     int              `json:"worldLevel"`
	RandomLevel    int              `json:"randomLevel"`
	DailyCompleted bool             `json:"dailyCompleted"`
	Stats          *DailyLevelStats `json:"stats,omitempty"`
}

func GetProgressHandler(c *gin.Context) {
	var req GetProgressInfo
	if err := c.ShouldBindQuery(&req); err != nil {
		fmt.Println(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query parameters"})
		return
	}

	ctx := context.Background()

	response := GetProgressResponse{
		WorldLevel:     nextLevelFor(ctx, req.UserID, domain.GameModeNormal),
		RandomLevel:    nextLevelFor(ctx, req.UserID, domain.GameModeRandom),
		DailyCompleted: repositories.HasUserCompletedTodaysLevel(ctx, req.UserID),
		Stats:          buildDailyLevelStats(ctx, req.UserID),
	}

	c.JSON(http.StatusOK, response)
}

// nextLevelFor returns the level the user is about to play in a mode, never
// below 1.
func nextLevelFor(ctx context.Context, userID string, gameMode string) int {
	level := repositories.GetLastLevelFromHistory(ctx, userID, gameMode) + 1
	if level < 1 {
		level = 1
	}
	return level
}
