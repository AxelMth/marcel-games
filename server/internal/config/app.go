package config

import "os"

// AppID identifies which game this server instance is serving.
// It is configured via environment variables so the same codebase
// can be deployed for multiple games.
type AppID string

const (
	AppIDEarthunt  AppID = "EARTHUNT"
	AppIDWordclimb AppID = "WORDCLIMB"
)

// GetAppID returns the current application identifier based on environment.
// It first checks APP_ID, then GAME_APP, and defaults to EARTHUNT when unset
// or unknown so local development keeps working without extra config.
func GetAppID() AppID {
	if v := os.Getenv("APP_ID"); v != "" {
		return normalize(AppID(v))
	}
	if v := os.Getenv("GAME_APP"); v != "" {
		return normalize(AppID(v))
	}
	return AppIDEarthunt
}

func normalize(id AppID) AppID {
	switch id {
	case AppIDWordclimb:
		return AppIDWordclimb
	default:
		return AppIDEarthunt
	}
}

