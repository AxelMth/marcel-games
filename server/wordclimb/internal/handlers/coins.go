package handlers

import (
	"context"
	"fmt"
	"time"

	"marcel-games-backend/internal/domain"
	"marcel-games-backend/internal/repositories"
)

// coinBalance reads a user's coins, applying the weekly refill if one is due,
// and persists the result.
//
// The refill is lazy rather than a scheduled job: there is no cron that could
// touch every account at midnight on Monday without a migration-sized write,
// and a player who does not open the app does not need their coins yet. Every
// endpoint that reports a balance goes through here, so the top-up lands on
// whichever the player hits first.
//
// A read failure returns nil rather than a zero balance: the client keeps its
// own mirror, and "no answer" leaves it alone, while zero would wipe it.
func coinBalance(ctx context.Context, userID string) *int {
	return chargeCoins(ctx, userID, 0, 0)
}

// chargeCoins refills if due, debits what a finished level reported spending,
// and writes the result back. spent is clamped by domain.DebitCoins against
// `limit` — it comes from the client and is not trusted.
func chargeCoins(ctx context.Context, userID string, spent, limit int) *int {
	if userID == "" {
		return nil
	}

	user, err := repositories.GetUserByID(ctx, userID)
	if err != nil || user == nil {
		// An id the server never issued, or a database that is not answering.
		// Either way there is no balance to report.
		return nil
	}

	balance, week := domain.RefillCoins(user.Coins, user.CoinsWeek, time.Now())
	balance = domain.DebitCoins(balance, spent, limit)

	if balance != user.Coins || week != user.CoinsWeek {
		if err := repositories.SetUserCoins(ctx, userID, balance, week); err != nil {
			// The player keeps the coins for now; the next call retries. Worth
			// saying out loud because a balance that never persists would show
			// up as hints that are free forever.
			fmt.Println("Failed to persist coin balance", err)
		}
	}

	return &balance
}
