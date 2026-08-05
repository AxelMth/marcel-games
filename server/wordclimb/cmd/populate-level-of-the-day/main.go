package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"marcel-games-backend/db"
	"marcel-games-backend/internal/domain"
	"marcel-games-backend/internal/repositories"
	"os"
	"time"

	"github.com/joho/godotenv"
)

// Filling a window ahead instead of one day at a time is what makes a missed
// run harmless: the next one simply finds fewer gaps. Thirty days of buffer
// means the schedule can lapse for a month without a player noticing.
const defaultHorizonDays = 30

// The languages that get their own daily challenge. Mirrors the Locale enum in
// schema.prisma; a locale missing here simply has no daily puzzle.
var localesToFill = []string{domain.LocaleEN, domain.LocaleFR}

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
		for _, locale := range localesToFill {
			created, err := ensureLevel(ctx, locale, singleDay)
			if err != nil {
				log.Fatalf("Could not create the %s level for %s: %v", locale, singleDay.Format("2006-01-02"), err)
			}
			if created {
				fmt.Printf("Created the %s level for %s\n", locale, singleDay.Format("2006-01-02"))
			} else {
				fmt.Printf("The %s level for %s already exists\n", locale, singleDay.Format("2006-01-02"))
			}
		}
		return
	}

	window := daysToFill(time.Now(), *horizon)

	created, alreadyThere, failed := 0, 0, 0
	for _, day := range window {
		// Every language needs its own puzzle: a French player cannot guess an
		// English ladder.
		for _, locale := range localesToFill {
			didCreate, err := ensureLevel(ctx, locale, day)
			switch {
			case err != nil:
				// One bad day must not abandon the rest of the window.
				failed++
				log.Printf("Could not create the %s level for %s: %v", locale, day.Format("2006-01-02"), err)
			case didCreate:
				created++
			default:
				alreadyThere++
			}
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

// ensureLevel stores a locale's puzzle for a day if none is there yet, and
// reports whether it created one.
func ensureLevel(ctx context.Context, locale string, date time.Time) (bool, error) {
	day := startOfDayUTC(date)

	// Read through the same repository the API uses, so a day this job
	// considers filled is a day the API can actually serve.
	if existing := repositories.GetLevelOfTheDay(ctx, locale, day); existing != nil {
		return false, nil
	}

	// A pure function of the date, and the same one the API falls back to, so a
	// day written here and a day rebuilt there are the same ladder.
	level := repositories.GetDailyLevelFromCatalogue(ctx, locale, day)
	if level == nil {
		return false, fmt.Errorf("the %s catalogue is empty — run populate-levels first", locale)
	}

	_, err := repositories.CreateLevelOfTheDay(
		ctx,
		locale,
		day,
		level.BeginWord,
		level.EndWord,
		level.WordLadder,
	)
	if err != nil {
		return false, err
	}
	return true, nil
}

func startOfDayUTC(t time.Time) time.Time {
	return repositories.StartOfDayUTC(t)
}
