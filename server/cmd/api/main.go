package main

import (
	"fmt"
	"log"
	"marcel-games-backend/internal/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	r := gin.Default()
	r.SetTrustedProxies(nil)

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

	fmt.Println("Starting server at port 8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
