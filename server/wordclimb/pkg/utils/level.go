package utils

import "time"

// LevelDefinition is a playable puzzle. WordLadder holds the intermediate words
// only — the ones the player has to find — with the begin and end words in
// their own fields, the same shape the generated catalogue uses.
type LevelDefinition struct {
	Number     int
	BeginWord  string
	EndWord    string
	WordLadder []string
}

// LevelNumberToIndex maps a 1-based level number onto a position in a catalogue
// of levelCount puzzles, cycling back to the first one once the player is past
// the last. This mirrors the client, which does `progress % levels.length`
// (apps/wordclimb/lib/game-store.ts, getLevelForMode).
//
// Non-positive numbers clamp to the first level, so a corrupt or missing
// progression still yields a playable puzzle.
func LevelNumberToIndex(level, levelCount int) int {
	if levelCount <= 0 {
		return 0
	}
	if level < 1 {
		level = 1
	}
	return (level - 1) % levelCount
}

// DailyLevelIndex picks the puzzle for a day out of a catalogue of levelCount
// levels. It is deterministic: the same date always yields the same index, so
// the level of the day can be recomputed at any time instead of being read back
// from the database.
//
// The hash reproduces the client's getDailyLevelIndex
// (apps/wordclimb/lib/game-store.ts) so both sides pick the same puzzle for a
// given YYYY-MM-DD: h = h*31 + c over int32, then absolute value modulo the
// level count. Both sides format the date in UTC, so a device near midnight
// gets the same puzzle as the server.
func DailyLevelIndex(date time.Time, levelCount int) int {
	if levelCount <= 0 {
		return 0
	}

	dateStr := date.UTC().Format("2006-01-02")

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
