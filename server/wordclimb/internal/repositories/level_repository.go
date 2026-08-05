package repositories

import (
	"context"
	"marcel-games-backend/db"
	"marcel-games-backend/pkg/utils"
	"time"
)

// Level is a puzzle read from the catalogue table. WordLadder holds the
// intermediate words only, the ones the player has to find.
type Level struct {
	Number     int
	BeginWord  string
	EndWord    string
	WordLadder []string
}

// CountLevels returns how many puzzles the catalogue holds for a locale, or 0
// when the populate job has never run.
//
// It reads the highest level number rather than counting rows: cmd/populate-levels
// writes a contiguous 1..N and deletes anything above N, so the two are the same
// number — and this costs one indexed row instead of loading a 1400-level
// catalogue on every request.
func CountLevels(ctx context.Context, locale string) int {
	last, err := db.Client().Level.FindFirst(
		db.Level.Locale.Equals(db.Locale(locale)),
	).OrderBy(
		db.Level.Number.Order(db.DESC),
	).Exec(ctx)
	if err != nil || last == nil {
		return 0
	}
	return last.Number
}

// GetLevelByNumber returns the puzzle stored at a 1-based position in a
// locale's catalogue, or nil when there is none.
func GetLevelByNumber(ctx context.Context, locale string, number int) *Level {
	level, err := db.Client().Level.FindUnique(
		db.Level.LocaleNumber(
			db.Level.Locale.Equals(db.Locale(locale)),
			db.Level.Number.Equals(number),
		),
	).Exec(ctx)
	if err != nil || level == nil {
		return nil
	}
	return &Level{
		Number:     level.Number,
		BeginWord:  level.BeginWord,
		EndWord:    level.EndWord,
		WordLadder: level.WordLadder,
	}
}

// GetLevelForPlay resolves the puzzle a player gets for a level number, cycling
// back to the start of the catalogue once they are past the last one — the same
// wrap the client applies offline.
//
// It returns nil when the catalogue is empty for that locale, which is what the
// populate job not having run looks like.
func GetLevelForPlay(ctx context.Context, locale string, levelNumber int) *Level {
	count := CountLevels(ctx, locale)
	if count == 0 {
		return nil
	}
	index := utils.LevelNumberToIndex(levelNumber, count)
	return GetLevelByNumber(ctx, locale, index+1)
}

// GetDailyLevelFromCatalogue picks the puzzle a locale's daily challenge falls
// on for a day, straight out of the catalogue table.
//
// It is a pure function of the date and the catalogue size, which is what lets
// the populate job and the API's fallback agree without talking to each other:
// a day written by the job and a day recomputed by the API are the same ladder.
//
// Returns nil when the catalogue is empty for that locale.
func GetDailyLevelFromCatalogue(ctx context.Context, locale string, date time.Time) *Level {
	count := CountLevels(ctx, locale)
	if count == 0 {
		return nil
	}
	index := utils.DailyLevelIndex(date, count)
	return GetLevelByNumber(ctx, locale, index+1)
}

// UpsertLevel writes one catalogue entry, overwriting whatever occupied that
// position before. Regenerating the catalogue renumbers levels, so a plain
// create would collide on (locale, number).
func UpsertLevel(
	ctx context.Context,
	locale string,
	number int,
	beginWord string,
	endWord string,
	wordLadder []string,
) error {
	if wordLadder == nil {
		wordLadder = []string{}
	}
	_, err := db.Client().Level.UpsertOne(
		db.Level.LocaleNumber(
			db.Level.Locale.Equals(db.Locale(locale)),
			db.Level.Number.Equals(number),
		),
	).Create(
		db.Level.Locale.Set(db.Locale(locale)),
		db.Level.Number.Set(number),
		db.Level.BeginWord.Set(beginWord),
		db.Level.EndWord.Set(endWord),
		db.Level.WordLadder.Set(wordLadder),
	).Update(
		db.Level.BeginWord.Set(beginWord),
		db.Level.EndWord.Set(endWord),
		db.Level.WordLadder.Set(wordLadder),
	).Exec(ctx)
	return err
}

// DeleteLevelsAbove removes catalogue entries past the end of the locale's new
// catalogue. Without it, shrinking the catalogue would leave orphan puzzles the
// wrap-around could still hand out.
func DeleteLevelsAbove(ctx context.Context, locale string, lastNumber int) (int, error) {
	stale, err := db.Client().Level.FindMany(
		db.Level.Locale.Equals(db.Locale(locale)),
		db.Level.Number.Gt(lastNumber),
	).Exec(ctx)
	if err != nil {
		return 0, err
	}
	for _, level := range stale {
		if _, err := db.Client().Level.FindUnique(
			db.Level.ID.Equals(level.ID),
		).Delete().Exec(ctx); err != nil {
			return 0, err
		}
	}
	return len(stale), nil
}
