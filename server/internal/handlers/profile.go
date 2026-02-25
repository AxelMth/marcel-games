package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/marcelgames/marcel-games-api/internal/middleware"
)

type profileResponse struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	AvatarURL string `json:"avatar_url"`
	CreatedAt string `json:"created_at"`
}

// GetProfile godoc — GET /api/v1/profile/me
// Returns the authenticated user's profile.
func GetProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database unavailable"})
		return
	}

	var p profileResponse
	err := db.QueryRowContext(c.Request.Context(),
		`SELECT id, username, avatar_url, created_at FROM users WHERE id = $1`,
		userID,
	).Scan(&p.ID, &p.Username, &p.AvatarURL, &p.CreatedAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	c.JSON(http.StatusOK, p)
}

// UpdateProfile godoc — PATCH /api/v1/profile/me
// Updates username and/or avatar_url for the authenticated user.
func UpdateProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database unavailable"})
		return
	}

	var body struct {
		Username  string `json:"username"   binding:"omitempty,min=3,max=32,alphanum"`
		AvatarURL string `json:"avatar_url"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var p profileResponse
	err := db.QueryRowContext(c.Request.Context(), `
		UPDATE users
		SET
			username   = CASE WHEN $2 <> '' THEN $2 ELSE username END,
			avatar_url = CASE WHEN $3 <> '' THEN $3 ELSE avatar_url END,
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, username, avatar_url, created_at
	`, userID, body.Username, body.AvatarURL).
		Scan(&p.ID, &p.Username, &p.AvatarURL, &p.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	c.JSON(http.StatusOK, p)
}
