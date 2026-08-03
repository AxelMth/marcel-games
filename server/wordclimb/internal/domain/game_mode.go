package domain

import "strings"

// The game modes declared by the GameMode enum in schema.prisma. Sending
// anything else to the database fails the enum constraint at query time.
const (
	GameModeNormal        = "NORMAL"
	GameModeRandom        = "RANDOM"
	GameModeLevelOfTheDay = "LEVEL_OF_THE_DAY"
)

// NormalizeGameMode maps a client-supplied game mode onto the enum above.
//
// The client still carries earthunt's "WORLD" literal in places
// (apps/wordclimb/lib/game-store.ts, toBackendGameMode) and its own UI modes are
// lowercase "classic" / "daily" / "random", so accept those spellings rather
// than writing a value the database will reject. Anything unrecognised falls
// back to NORMAL, which is the mode a player gets by just opening the game.
func NormalizeGameMode(mode string) string {
	switch strings.ToUpper(strings.TrimSpace(mode)) {
	case GameModeLevelOfTheDay, "DAILY":
		return GameModeLevelOfTheDay
	case GameModeRandom:
		return GameModeRandom
	default:
		return GameModeNormal
	}
}
