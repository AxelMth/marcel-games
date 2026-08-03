package main

import (
	"context"
	"fmt"
	"log"
	"marcel-games-backend/db"
	"marcel-games-backend/internal/repositories"
	"marcel-games-backend/pkg/utils"
	"os"
	"time"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize database client
	if err := db.Initialize(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Disconnect()

	ctx := context.Background()

	// Get the date for which to create the level
	// By default, create for tomorrow
	targetDate := time.Now().Add(24 * time.Hour)

	// If a date is provided as argument, use that
	if len(os.Args) > 1 {
		parsedDate, err := time.Parse("2006-01-02", os.Args[1])
		if err != nil {
			log.Fatal("Invalid date format. Use YYYY-MM-DD format:", err)
		}
		targetDate = parsedDate
	}

	// Set the date to midnight
	targetDate = time.Date(targetDate.Year(), targetDate.Month(), targetDate.Day(), 0, 0, 0, 0, targetDate.Location())

	// Check if level already exists for this date
	existingLevel, _ := db.Client().LevelOfTheDay.FindFirst(
		db.LevelOfTheDay.Date.Equals(targetDate),
	).Exec(ctx)

	if existingLevel != nil {
		fmt.Printf("Level of the day already exists for %s\n", targetDate.Format("2006-01-02"))
		return
	}

	// Pick the puzzle for that date. This is a pure function of the date, so
	// re-running the job for a day always stores the same ladder, and the API can
	// recompute it if this job never ran.
	definition, ok := utils.GetLevelForDate(targetDate)
	if !ok {
		log.Fatal("No level could be generated: the dictionary has no solvable seed pair")
	}

	// Create the level of the day
	createdLevel, err := repositories.CreateLevelOfTheDay(ctx, targetDate, definition.WordLadder)
	if err != nil {
		log.Fatal("Failed to create level of the day:", err)
	}

	fmt.Printf("Successfully created level of the day for %s: %s -> %s in %d steps: %v\n",
		targetDate.Format("2006-01-02"),
		definition.BeginWord,
		definition.EndWord,
		len(definition.WordLadder)-1,
		definition.WordLadder)
	fmt.Printf("Level ID: %s\n", createdLevel.ID)
}
