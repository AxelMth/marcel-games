package handlers

import (
	"context"
	"fmt"
	"marcel-games-backend/internal/domain"
	"marcel-games-backend/internal/repositories"
	"net/http"

	"github.com/gin-gonic/gin"
)

type LaunchRequest struct {
	DeviceUUID   string `json:"deviceUUID"`
	Brand        string `json:"brand"`
	DeviceType   string `json:"deviceType"`
	IsDevice     bool   `json:"isDevice"`
	Manufacturer string `json:"manufacturer"`
	ModelName    string `json:"modelName"`
	OsName       string `json:"osName"`
	OsVersion    string `json:"osVersion"`
	GameMode     string `json:"gameMode"`
	// Optional: an absent locale means English, the app's own default.
	Locale string `json:"locale"`
}

func LaunchHandler(c *gin.Context) {
	var req LaunchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Println(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	ctx := context.Background()

	user, err := repositories.UpsertOneUser(ctx, req.DeviceUUID)

	if err != nil {
		fmt.Println("Failed to create user", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	_, err = repositories.UpsertOneUserDevice(
		ctx,
		user.ID,
		req.Brand,
		req.DeviceType,
		req.IsDevice,
		req.Manufacturer,
		req.ModelName,
		req.OsName,
		req.OsVersion,
	)

	if err != nil {
		fmt.Println("Failed to create user device", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user device"})
		return
	}

	gameMode := domain.NormalizeGameMode(req.GameMode)
	locale := domain.NormalizeLocale(req.Locale)
	nextLevel := repositories.GetLastLevelFromHistory(ctx, user.ID, gameMode) + 1
	payload := levelPayloadForNumber(ctx, locale, nextLevel)

	response := gin.H{
		"userId":     user.ID,
		"level":      nextLevel,
		"beginWord":  payload.BeginWord,
		"endWord":    payload.EndWord,
		"wordLadder": payload.WordLadder,
	}
	c.JSON(http.StatusOK, response)
}
