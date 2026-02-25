package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/marcelgames/marcel-games-api/internal/middleware"
)

type LeaderboardEntry struct {
	Rank     int    `json:"rank"`
	UserID   string `json:"userId"`
	Username string `json:"username"`
	Score    int    `json:"score"`
}

// GetLeaderboard returns the top 50 scores for the current app (resolved via Host header).
func GetLeaderboard(c *gin.Context) {
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database unavailable"})
		return
	}

	rows, err := db.Query(`
		SELECT u.id, u.username, s.score
		FROM scores s
		JOIN users u ON u.id = s.user_id
		ORDER BY s.score DESC
		LIMIT 50
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch leaderboard"})
		return
	}
	defer rows.Close()

	var entries []LeaderboardEntry
	rank := 1
	for rows.Next() {
		var e LeaderboardEntry
		if err := rows.Scan(&e.UserID, &e.Username, &e.Score); err != nil {
			continue
		}
		e.Rank = rank
		rank++
		entries = append(entries, e)
	}

	c.JSON(http.StatusOK, entries)
}

// UpsertScore creates or updates the score for the authenticated user.
func UpsertScore(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	var body struct {
		Score int `json:"score" binding:"required,min=0"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database unavailable"})
		return
	}

	_, err := db.Exec(`
		INSERT INTO scores (user_id, score)
		VALUES ($1, $2)
		ON CONFLICT (user_id) DO UPDATE SET score = GREATEST(scores.score, EXCLUDED.score)
	`, userID, body.Score)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update score"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
