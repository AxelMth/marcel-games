package main

import (
	"fmt"
	"log"
	"marcel-games-backend/internal/config"
	"marcel-games-backend/internal/handlers"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	appID := config.GetAppID()

	r := gin.Default()
	r.SetTrustedProxies(nil)

	// Simple request logging with app identifier so shared deployments
	// can be distinguished in logs.
	r.Use(func(c *gin.Context) {
		start := time.Now()
		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()
		log.Printf("[%s] %s %s %d %s", appID, c.Request.Method, c.Request.URL.Path, status, latency)
	})

	// CORS: allow all origins so cross-origin calls are not blocked
	r.Use(cors.New(cors.Config{
		AllowOriginFunc:  func(origin string) bool { return true },
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	r.POST("/launch", handlers.LaunchHandler)

	r.GET("/progress", handlers.GetProgressHandler)
	r.GET("/profile", handlers.GetProfileHandler)
	r.GET("/level", handlers.GetLevelHandler)
	// deprecated
	r.POST("/end-level", handlers.FinishLevelHandler)
	r.POST("/level", handlers.FinishLevelHandler)

	fmt.Printf("Starting server for app %s at port 8080\n", appID)
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
