// Package router wires all routes for the marcel-games-api.
package router

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/marcelgames/marcel-games-api/internal/config"
	"github.com/marcelgames/marcel-games-api/internal/handlers"
	"github.com/marcelgames/marcel-games-api/internal/middleware"
)

// New builds and returns the configured Gin engine.
func New(dbs *middleware.AppDatabases, cfg *config.Config) *gin.Engine {
	gin.SetMode(cfg.GinMode)

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// CORS — allow both app origins and local dev servers
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"https://" + cfg.EarthuntHost, "https://" + cfg.WordclimbHost, "http://localhost:3001", "http://localhost:3002"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Inject the correct DB based on the Host header
	r.Use(middleware.AppSelector(dbs))

	authHandler := handlers.NewAuthHandler(cfg.JWTSecret)

	// ── Health ──────────────────────────────────────────────────────────────
	r.GET("/health", handlers.Health)

	// ── API v1 ──────────────────────────────────────────────────────────────
	v1 := r.Group("/api/v1")
	{
		// Auth — public
		auth := v1.Group("/auth")
		{
			auth.POST("/signup", authHandler.SignUp)
			auth.POST("/signin", authHandler.SignIn)
		}

		// Profile — authenticated
		profile := v1.Group("/profile")
		profile.Use(middleware.JWTAuth(cfg.JWTSecret))
		{
			profile.GET("/me", handlers.GetProfile)
			profile.PATCH("/me", handlers.UpdateProfile)
		}

		// Scores — submit requires auth, personal history requires auth
		scores := v1.Group("/scores")
		{
			scores.POST("", middleware.JWTAuth(cfg.JWTSecret), handlers.SubmitScore)
			scores.GET("/me", middleware.JWTAuth(cfg.JWTSecret), handlers.GetPersonalBest)
			scores.GET("/me/history", middleware.JWTAuth(cfg.JWTSecret), handlers.GetScoreHistory)
		}

		// Leaderboard — read is public, upsert requires auth
		lb := v1.Group("/leaderboard")
		{
			lb.GET("", handlers.GetLeaderboard)
			lb.POST("", middleware.JWTAuth(cfg.JWTSecret), handlers.UpsertScore)
		}
	}

	return r
}
