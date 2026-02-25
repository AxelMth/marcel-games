package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/marcelgames/marcel-games-api/internal/middleware"
)

type scoreRecord struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	Score     int64  `json:"score"`
	Metadata  any    `json:"metadata"`
	CreatedAt string `json:"created_at"`
}

// SubmitScore godoc — POST /api/v1/scores
// Inserts a new score row; use this for per-run tracking (history).
func SubmitScore(c *gin.Context) {
	userID := middleware.GetUserID(c)
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database unavailable"})
		return
	}

	var body struct {
		Score    int64  `json:"score"    binding:"required"`
		Metadata string `json:"metadata"` // raw JSON string, stored as JSONB
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if body.Metadata == "" {
		body.Metadata = "{}"
	}

	var rec scoreRecord
	err := db.QueryRowContext(c.Request.Context(), `
		INSERT INTO scores (user_id, score, metadata)
		VALUES ($1, $2, $3::jsonb)
		ON CONFLICT (user_id)
		DO UPDATE SET score = GREATEST(scores.score, EXCLUDED.score), metadata = EXCLUDED.metadata
		RETURNING id, user_id, score, metadata, created_at
	`, userID, body.Score, body.Metadata).
		Scan(&rec.ID, &rec.UserID, &rec.Score, &rec.Metadata, &rec.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save score"})
		return
	}

	c.JSON(http.StatusCreated, rec)
}

// GetPersonalBest godoc — GET /api/v1/scores/me
// Returns the authenticated user's best score.
func GetPersonalBest(c *gin.Context) {
	userID := middleware.GetUserID(c)
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database unavailable"})
		return
	}

	var rec scoreRecord
	err := db.QueryRowContext(c.Request.Context(),
		`SELECT id, user_id, score, metadata, created_at FROM scores WHERE user_id = $1`,
		userID,
	).Scan(&rec.ID, &rec.UserID, &rec.Score, &rec.Metadata, &rec.CreatedAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusOK, gin.H{"best": nil})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"best": rec})
}

// GetScoreHistory godoc — GET /api/v1/scores/me/history?limit=20&offset=0
// Returns paginated score history for the authenticated user.
func GetScoreHistory(c *gin.Context) {
	userID := middleware.GetUserID(c)
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database unavailable"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit > 100 {
		limit = 100
	}

	rows, err := db.QueryContext(c.Request.Context(), `
		SELECT id, user_id, score, metadata, created_at
		FROM scores
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}
	defer rows.Close()

	var records []scoreRecord
	for rows.Next() {
		var r scoreRecord
		if err := rows.Scan(&r.ID, &r.UserID, &r.Score, &r.Metadata, &r.CreatedAt); err != nil {
			continue
		}
		records = append(records, r)
	}
	if records == nil {
		records = []scoreRecord{}
	}

	c.JSON(http.StatusOK, gin.H{"scores": records})
}
