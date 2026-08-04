package handlers

import (
	"context"
	"fmt"
	"marcel-games-backend/internal/repositories"
	"net/http"

	"github.com/gin-gonic/gin"
)

type GetLevelInfo struct {
	UserID string `form:"userId" binding:"required"`
	// TODO: Add game mode validation
	GameMode string `form:"gameMode" binding:"required"`
	// TODO: Add continent validation
	Continent string `form:"continent"`
}

type GetLevelInfoResponse struct {
	Level        int              `json:"level"`
	CountryCodes []string         `json:"countryCodes"`
	Stats        *DailyLevelStats `json:"stats,omitempty"`
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

	// Normalize continent for world/daily so it matches stored level history (same as FinishLevelHandler)
	if req.Continent == "" && (req.GameMode == "WORLD" || req.GameMode == "LEVEL_OF_THE_DAY") {
		req.Continent = "WORLD"
	}

	ctx := context.Background()

	var currentLevel int
	var countryCodes []string
	var stats *DailyLevelStats

	fmt.Println("req.GameMode", req.GameMode)
	if req.GameMode == "LEVEL_OF_THE_DAY" {
		// Check if user has already completed today's level
		hasCompletedToday := repositories.HasUserCompletedTodaysLevel(ctx, req.UserID)
		if hasCompletedToday {
			// Return empty country codes if already completed
			countryCodes = []string{}
			currentLevel = 1 // Level of the day is always level 1
		} else {
			// Get today's country codes
			countryCodes = repositories.GetLevelOfTheDayCountryCodes(ctx)
			currentLevel = 1
		}

		// Calculate daily level statistics
		dailyLevelsCompleted := repositories.GetUserDailyLevelCount(ctx, req.UserID)
		lastLevelRank, _ := repositories.GetUserRankForLastDailyLevel(ctx, req.UserID)
		globalRank, _ := repositories.GetUserGlobalDailyRank(ctx, req.UserID)

		stats = &DailyLevelStats{
			DailyLevelsCompleted: dailyLevelsCompleted,
			LastLevelRank:        lastLevelRank,
			GlobalRank:           globalRank,
		}
	} else {
		// For other game modes, get the last level and increment
		level := repositories.GetLastLevelFromHistory(ctx, req.UserID, req.GameMode, req.Continent)
		currentLevel = level + 1
		countryCodes = getCountryCodes(req.GameMode, req.Continent, currentLevel)
	}

	response := GetLevelInfoResponse{
		Level:        currentLevel,
		CountryCodes: countryCodes,
		Stats:        stats,
	}

	c.JSON(http.StatusOK, response)
}

type FinishLevelInfo struct {
	UserID       string   `json:"userId"`
	Attempts     int      `json:"attempts"`
	TimeSpent    int      `json:"timeSpent"`
	HintsUsed    int      `json:"hintsUsed"`
	GameMode     string   `json:"gameMode"`
	Continent    string   `json:"continent"`
	CountryCodes []string `json:"countryCodes"`
}

type FinishLevelResponse struct {
	NextLevel        int              `json:"nextLevel"`
	NextCountryCodes []string         `json:"nextCountryCodes"`
	Stats            *DailyLevelStats `json:"stats,omitempty"`
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

	// Continent is required by DB enum; default to WORLD for world/daily modes when client sends empty
	if req.Continent == "" {
		req.Continent = "WORLD"
	}

	ctx := context.Background()

	level := repositories.GetLastLevelFromHistory(ctx, req.UserID, req.GameMode, req.Continent)

	_, err := repositories.CreateOneLevelHistory(
		ctx,
		req.UserID,
		level+1,
		req.Attempts,
		req.TimeSpent,
		req.HintsUsed,
		req.GameMode,
		req.Continent,
		req.CountryCodes,
	)

	if err != nil {
		fmt.Println("Failed to create level history", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create level history"})
		return
	}

	var nextLevel int
	var countryCodes []string
	var stats *DailyLevelStats

	if req.GameMode == "LEVEL_OF_THE_DAY" {
		// For level of the day, return empty country codes after completion
		nextLevel = 1
		countryCodes = []string{}

		// Calculate updated daily level statistics after completion
		dailyLevelsCompleted := repositories.GetUserDailyLevelCount(ctx, req.UserID)
		lastLevelRank, _ := repositories.GetUserRankForLastDailyLevel(ctx, req.UserID)
		globalRank, _ := repositories.GetUserGlobalDailyRank(ctx, req.UserID)

		stats = &DailyLevelStats{
			DailyLevelsCompleted: dailyLevelsCompleted,
			LastLevelRank:        lastLevelRank,
			GlobalRank:           globalRank,
		}
	} else {
		nextLevel = level + 2
		countryCodes = getCountryCodes(req.GameMode, req.Continent, nextLevel)
	}

	response := FinishLevelResponse{
		NextLevel:        nextLevel,
		NextCountryCodes: countryCodes,
		Stats:            stats,
	}

	c.JSON(http.StatusOK, response)
}

// getCountryCodes no longer picks the countries for the solo modes.
//
// It used to draw them from the package-level random source on every request,
// so three identical calls for the same user and level answered USA, then BRA,
// then CHN. The board changed under the player each time the level was
// re-fetched, and it took their paid hints with it: hints are filed under the
// code of the country they describe, so a new draw orphaned them.
//
// World and Continent are single-player progressions with no reason for the
// server to choose their content. The client already derives them from the
// level id with a seeded shuffle, the same way it does offline, so leaving it
// as the only generator makes a level reproducible by construction rather than
// by keeping two implementations in step.
//
// The level of the day is different and stays server-side: every player must
// get the same puzzle, so it is stored, not derived.
func getCountryCodes(_ string, _ string, _ int) []string {
	return []string{}
}

// Progress response for carousel: current level per mode and daily completion.
var progressContinents = []string{"EUROPE", "ASIA", "AMERICAS", "AFRICA", "OCEANIA"}

type GetProgressInfo struct {
	UserID string `form:"userId" binding:"required"`
}

type GetProgressResponse struct {
	WorldLevel      int               `json:"worldLevel"`
	ContinentLevels map[string]int    `json:"continentLevels"`
	DailyCompleted  bool              `json:"dailyCompleted"`
	Stats           *DailyLevelStats  `json:"stats,omitempty"`
}

func GetProgressHandler(c *gin.Context) {
	var req GetProgressInfo
	if err := c.ShouldBindQuery(&req); err != nil {
		fmt.Println(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query parameters"})
		return
	}

	ctx := context.Background()

	worldLast := repositories.GetLastLevelFromHistory(ctx, req.UserID, "WORLD", "WORLD")
	worldLevel := worldLast + 1
	if worldLevel < 1 {
		worldLevel = 1
	}

	continentLevels := make(map[string]int)
	for _, cont := range progressContinents {
		last := repositories.GetLastLevelFromHistory(ctx, req.UserID, "CONTINENTS", cont)
		level := last + 1
		if level < 1 {
			level = 1
		}
		continentLevels[cont] = level
	}

	dailyCompleted := repositories.HasUserCompletedTodaysLevel(ctx, req.UserID)

	var stats *DailyLevelStats
	dailyLevelsCompleted := repositories.GetUserDailyLevelCount(ctx, req.UserID)
	lastLevelRank, _ := repositories.GetUserRankForLastDailyLevel(ctx, req.UserID)
	globalRank, _ := repositories.GetUserGlobalDailyRank(ctx, req.UserID)
	stats = &DailyLevelStats{
		DailyLevelsCompleted: dailyLevelsCompleted,
		LastLevelRank:        lastLevelRank,
		GlobalRank:           globalRank,
	}

	response := GetProgressResponse{
		WorldLevel:      worldLevel,
		ContinentLevels: continentLevels,
		DailyCompleted:  dailyCompleted,
		Stats:           stats,
	}
	c.JSON(http.StatusOK, response)
}
