package handlers

import (
	"context"
	"fmt"
	"marcel-games-backend/internal/repositories"
	"net/http"

	"github.com/gin-gonic/gin"
)

type GetProfileInfo struct {
	UserID string `form:"userId" binding:"required"`
}

type ProfileStats struct {
	DailyLevelsCompleted int `json:"dailyLevelsCompleted"`
	LastLevelRank        int `json:"lastLevelRank"`
	GlobalRank           int `json:"globalRank"`
}

type GetProfileResponse struct {
	GameHistory []repositories.GameHistoryEntry `json:"gameHistory"`
	Stats       ProfileStats                    `json:"stats"`
}

func GetProfileHandler(c *gin.Context) {
	var req GetProfileInfo
	if err := c.ShouldBindQuery(&req); err != nil {
		fmt.Println(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query parameters"})
		return
	}

	ctx := context.Background()

	gameHistory, err := repositories.GetUserLevelHistory(ctx, req.UserID, 50)
	if err != nil {
		fmt.Println("Failed to get level history", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get profile"})
		return
	}

	dailyLevelsCompleted := repositories.GetUserDailyLevelCount(ctx, req.UserID)
	lastLevelRank, _ := repositories.GetUserRankForLastDailyLevel(ctx, req.UserID)
	globalRank, _ := repositories.GetUserGlobalDailyRank(ctx, req.UserID)

	response := GetProfileResponse{
		GameHistory: gameHistory,
		Stats: ProfileStats{
			DailyLevelsCompleted: dailyLevelsCompleted,
			LastLevelRank:        lastLevelRank,
			GlobalRank:           globalRank,
		},
	}

	c.JSON(http.StatusOK, response)
}
