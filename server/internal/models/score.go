package models

import "time"

// AppID identifies which game a score belongs to.
type AppID string

const (
	AppEarthunt  AppID = "earthunt"
	AppWordClimb AppID = "wordclimb"
)

// Score represents a single game result submitted by a player.
type Score struct {
	ID        int64     `json:"id"         db:"id"`
	UserID    int64     `json:"user_id"    db:"user_id"`
	AppID     AppID     `json:"app_id"     db:"app_id"`
	Value     int64     `json:"value"      db:"value"`
	Metadata  string    `json:"metadata"   db:"metadata"` // arbitrary JSON blob per game
	CreatedAt time.Time `json:"created_at" db:"created_at"`

	// Joined fields
	Username  string `json:"username,omitempty"   db:"username"`
	AvatarURL string `json:"avatar_url,omitempty" db:"avatar_url"`
}

// SubmitScoreRequest is the payload for POST /scores.
type SubmitScoreRequest struct {
	Value    int64  `json:"value"    binding:"required"`
	Metadata string `json:"metadata"`
}

// LeaderboardEntry is the public-facing leaderboard row.
type LeaderboardEntry struct {
	Rank      int    `json:"rank"`
	UserID    int64  `json:"user_id"`
	Username  string `json:"username"`
	AvatarURL string `json:"avatar_url"`
	Value     int64  `json:"value"`
}
