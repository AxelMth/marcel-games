package utils

import (
	"marcel-games-backend/internal/constants"
	"sync"
	"time"
)

var (
	levelsOnce sync.Once
	levels     []LevelDefinition
	dictionary map[string]struct{}
)

// load builds the dictionary and the curated levels once, on first use.
// Ladders are computed rather than stored so the dictionary stays the single
// source of truth: a word removed from constants.Words can never survive in a
// ladder the server hands out.
func load() {
	levelsOnce.Do(func() {
		dictionary = ToWordSet(constants.Words)

		seeds := make([]SeedPair, 0, len(constants.LevelSeeds))
		for _, seed := range constants.LevelSeeds {
			seeds = append(seeds, SeedPair{
				ID:        seed.ID,
				BeginWord: seed.BeginWord,
				EndWord:   seed.EndWord,
			})
		}

		levels = GenerateLevels(seeds, dictionary)
	})
}

// Dictionary returns the word set every ladder is built from.
func Dictionary() map[string]struct{} {
	load()
	return dictionary
}

// AllLevels returns the curated levels in seed order, each with its ladder
// filled in. Seeds with no ladder in the dictionary are dropped by
// GenerateLevels, so this can be shorter than constants.LevelSeeds.
func AllLevels() []LevelDefinition {
	load()
	return levels
}

// GetLevelForNumber returns the level to play for a 1-based level number,
// cycling back to the first puzzle once the player is past the last one. This
// mirrors the client, which does `progress % validLevels.length`
// (apps/wordclimb/lib/game-store.ts, getLevelForMode).
//
// The bool is false only when no level could be generated at all.
func GetLevelForNumber(level int) (LevelDefinition, bool) {
	all := AllLevels()
	if len(all) == 0 {
		return LevelDefinition{}, false
	}
	if level < 1 {
		level = 1
	}
	return all[(level-1)%len(all)], true
}

// GetLevelForDate returns the puzzle for a given day. It is deterministic: the
// same date always yields the same level, so the level of the day can be
// recomputed at any time instead of being read back from the database.
//
// The hash reproduces the client's getDailyLevelIndex
// (apps/wordclimb/lib/game-store.ts) so both sides pick the same puzzle for a
// given YYYY-MM-DD. Note the client hashes the *device local* date while the
// server hashes whatever date it is handed, so callers should pass UTC and
// accept that a device near midnight can be a day off.
func GetLevelForDate(date time.Time) (LevelDefinition, bool) {
	all := AllLevels()
	if len(all) == 0 {
		return LevelDefinition{}, false
	}
	return all[dailyLevelIndex(date, len(all))], true
}

// dailyLevelIndex hashes a YYYY-MM-DD date string the same way the client does:
// h = h*31 + c over int32, then absolute value modulo the level count.
func dailyLevelIndex(date time.Time, levelCount int) int {
	dateStr := date.Format("2006-01-02")

	var hash int32
	for _, char := range dateStr {
		// (hash << 5) - hash is hash * 31; int32 makes the overflow wrap the
		// same way the client's `hash |= 0` does.
		hash = (hash << 5) - hash + int32(char)
	}

	// Widen before negating: -math.MinInt32 does not fit in an int32.
	abs := int64(hash)
	if abs < 0 {
		abs = -abs
	}

	return int(abs % int64(levelCount))
}
