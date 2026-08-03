package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"marcel-games-backend/db"
	"marcel-games-backend/internal/repositories"
	"marcel-games-backend/pkg/utils"
	"os"
	"time"

	"github.com/joho/godotenv"
)

// Filling a window ahead instead of one day at a time is what makes a missed
// run harmless: the next one simply finds fewer gaps. Thirty days of buffer
// means the schedule can lapse for a month without a player noticing.
const defaultHorizonDays = 30

func main() {
	horizon := flag.Int("days", defaultHorizonDays, "how many days ahead of today to fill")
	flag.Parse()

	// Validate the inputs before opening a connection. A typo in a workflow
	// input should cost nothing and say what is wrong, rather than surface as a
	// Prisma validation error from an unrelated layer.
	var singleDay time.Time
	fillOneDay := false
	if args := flag.Args(); len(args) > 0 {
		day, err := time.Parse("2006-01-02", args[0])
		if err != nil {
			log.Fatalf("Invalid date %q, expected YYYY-MM-DD: %v", args[0], err)
		}
		singleDay, fillOneDay = day, true
	} else if *horizon < 0 {
		log.Fatalf("-days cannot be negative, got %d", *horizon)
	}

	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	if err := db.Initialize(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Disconnect()

	ctx := context.Background()

	// An explicit date fills just that day — what the workflow's manual
	// target_date input uses to repair or replace a single puzzle.
	if fillOneDay {
		created, err := ensureLevel(ctx, singleDay)
		if err != nil {
			log.Fatalf("Could not create the level for %s: %v", singleDay.Format("2006-01-02"), err)
		}
		if created {
			fmt.Printf("Created the level for %s\n", singleDay.Format("2006-01-02"))
		} else {
			fmt.Printf("The level for %s already exists\n", singleDay.Format("2006-01-02"))
		}
		return
	}

	window := daysToFill(time.Now(), *horizon)

	created, alreadyThere, failed := 0, 0, 0
	for _, day := range window {
		didCreate, err := ensureLevel(ctx, day)
		switch {
		case err != nil:
			// One bad day must not abandon the rest of the window.
			failed++
			log.Printf("Could not create the level for %s: %v", day.Format("2006-01-02"), err)
		case didCreate:
			created++
		default:
			alreadyThere++
		}
	}

	fmt.Printf("%s..%s: created %d, already present %d, failed %d\n",
		window[0].Format("2006-01-02"),
		window[len(window)-1].Format("2006-01-02"),
		created, alreadyThere, failed)

	// Fail the job on any gap left behind, so a silent partial fill cannot pass
	// for a healthy run.
	if failed > 0 {
		os.Exit(1)
	}
}

// daysToFill lists the days a run covers: today first — when the schedule has
// lapsed, today is the gap players are staring at right now — then every day up
// to and including today+horizon.
func daysToFill(now time.Time, horizon int) []time.Time {
	today := startOfDayUTC(now)
	days := make([]time.Time, 0, horizon+1)
	for offset := 0; offset <= horizon; offset++ {
		days = append(days, today.AddDate(0, 0, offset))
	}
	return days
}

// ensureLevel stores the puzzle for a day if none is there yet, and reports
// whether it created one.
func ensureLevel(ctx context.Context, date time.Time) (bool, error) {
	day := startOfDayUTC(date)

	// Matched as a UTC range, the same way the API reads today's row. Matching
	// on exact equality against a local midnight, as this used to, could miss a
	// row the API serves happily and store a duplicate next to it.
	existing, err := db.Client().LevelOfTheDay.FindFirst(
		db.LevelOfTheDay.Date.Gte(day),
		db.LevelOfTheDay.Date.Lt(day.Add(24*time.Hour)),
	).Exec(ctx)
	if err == nil && existing != nil && len(existing.WordLadder) >= 2 {
		return false, nil
	}

	// A pure function of the date, and the same one the API falls back to, so a
	// day written here and a day rebuilt there are the same ladder.
	definition, ok := utils.GetLevelForDate(day)
	if !ok {
		return false, fmt.Errorf("the dictionary has no solvable seed pair")
	}

	if _, err := repositories.CreateLevelOfTheDay(ctx, day, definition.WordLadder); err != nil {
		return false, err
	}
	return true, nil
}

func startOfDayUTC(t time.Time) time.Time {
	utc := t.UTC()
	return time.Date(utc.Year(), utc.Month(), utc.Day(), 0, 0, 0, 0, time.UTC)
}
