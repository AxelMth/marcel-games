package repositories

import (
	"context"
	"marcel-games-backend/db"
	"time"
)

// StartOfDayUTC truncates an instant to midnight UTC.
//
// Every "day" in the game is a UTC day: the daily challenge turns over at
// midnight UTC, and the client formats its own date in UTC to match
// (apps/wordclimb/lib/game-store.ts). Using the server's local midnight instead
// would move the boundary with the deployment's timezone.
func StartOfDayUTC(t time.Time) time.Time {
	utc := t.UTC()
	return time.Date(utc.Year(), utc.Month(), utc.Day(), 0, 0, 0, 0, time.UTC)
}

// GetLevelOfTheDay returns the puzzle stored for a locale on a given day, or
// nil when none has been populated.
func GetLevelOfTheDay(ctx context.Context, locale string, date time.Time) *Level {
	day := StartOfDayUTC(date)

	// Matched as a range rather than on exact equality: the column is a
	// timestamp, and a row written with any time-of-day still belongs to its day.
	levelOfTheDay, err := db.Client().LevelOfTheDay.FindFirst(
		db.LevelOfTheDay.Locale.Equals(db.Locale(locale)),
		db.LevelOfTheDay.Date.Gte(day),
		db.LevelOfTheDay.Date.Lt(day.Add(24*time.Hour)),
	).Exec(ctx)

	if err != nil || levelOfTheDay == nil {
		return nil
	}
	if levelOfTheDay.BeginWord == "" || len(levelOfTheDay.WordLadder) == 0 {
		return nil
	}

	return &Level{
		BeginWord:  levelOfTheDay.BeginWord,
		EndWord:    levelOfTheDay.EndWord,
		WordLadder: levelOfTheDay.WordLadder,
	}
}

// HasUserCompletedTodaysLevel reports whether the user already finished today's
// daily challenge, today being the UTC day.
func HasUserCompletedTodaysLevel(ctx context.Context, userID string) bool {
	today := StartOfDayUTC(time.Now())

	levelHistory, err := db.Client().LevelHistory.FindFirst(
		db.LevelHistory.UserID.Equals(userID),
		db.LevelHistory.GameMode.Equals(db.GameMode("LEVEL_OF_THE_DAY")),
		db.LevelHistory.CreatedAt.Gte(today),
		db.LevelHistory.CreatedAt.Lt(today.Add(24*time.Hour)),
	).Exec(ctx)

	return err == nil && levelHistory != nil
}

// DeleteLevelsOfTheDayAfter removes a locale's daily puzzles for every day
// strictly after the given one, and reports how many it deleted.
//
// The counterpart to the guarantee below: copying the puzzle in means a
// regenerated catalogue does not disturb days already played, but it also means
// the days queued ahead keep serving puzzles from the catalogue that is gone.
// An offline client computes its daily from the catalogue it ships, so for the
// length of that queue the two would hand out different puzzles.
//
// Strictly after, never including the day passed in: today's puzzle may already
// have been played and ranked, and replacing it under those players would
// invalidate their result.
func DeleteLevelsOfTheDayAfter(ctx context.Context, locale string, day time.Time) (int, error) {
	after := StartOfDayUTC(day).Add(24 * time.Hour)

	result, err := db.Client().LevelOfTheDay.FindMany(
		db.LevelOfTheDay.Locale.Equals(db.Locale(locale)),
		db.LevelOfTheDay.Date.Gte(after),
	).Delete().Exec(ctx)

	if err != nil {
		return 0, err
	}
	return int(result.Count), nil
}

// CreateLevelOfTheDay stores the puzzle for a locale on a day. The whole puzzle
// is copied in rather than referenced, so regenerating the catalogue can never
// change a day that has already been played.
func CreateLevelOfTheDay(
	ctx context.Context,
	locale string,
	date time.Time,
	beginWord string,
	endWord string,
	wordLadder []string,
) (*db.LevelOfTheDayModel, error) {
	if wordLadder == nil {
		wordLadder = []string{}
	}
	return db.Client().LevelOfTheDay.CreateOne(
		db.LevelOfTheDay.Date.Set(StartOfDayUTC(date)),
		db.LevelOfTheDay.Locale.Set(db.Locale(locale)),
		db.LevelOfTheDay.BeginWord.Set(beginWord),
		db.LevelOfTheDay.EndWord.Set(endWord),
		db.LevelOfTheDay.WordLadder.Set(wordLadder),
	).Exec(ctx)
}
