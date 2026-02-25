package handlers

import (
	"context"
	"fmt"
	"marcel-games-backend/internal/repositories"
	"marcel-games-backend/pkg/utils"
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
	Continent    string `json:"continent"`
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

	// Normalize continent for world/daily so it matches stored level history
	continent := req.Continent
	if continent == "" && (req.GameMode == "WORLD" || req.GameMode == "LEVEL_OF_THE_DAY") {
		continent = "WORLD"
	}
	currentLevel := repositories.GetLastLevelFromHistory(ctx, user.ID, req.GameMode, continent)

	response := gin.H{"userId": user.ID, "level": currentLevel + 1, "countryCodes": utils.GetLevelCountryCodesForLevel(currentLevel + 1)}
	c.JSON(http.StatusOK, response)
}
