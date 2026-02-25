package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/marcelgames/marcel-games-api/internal/middleware"
)

// Health returns a 200 with the name of the connected database.
// Used by Fly.io health checks.
func Health(c *gin.Context) {
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "no database"})
		return
	}

	if err := db.Ping(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "database unreachable",
			"db":     db.Label,
			"error":  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"db":     db.Label,
	})
}
