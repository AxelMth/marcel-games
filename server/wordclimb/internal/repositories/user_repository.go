package repositories

import (
	"context"
	"marcel-games-backend/db"
	"time"
)

func GetUserByID(ctx context.Context, id string) (*db.UserModel, error) {
	user, err := db.Client().User.FindUnique(
		db.User.ID.Equals(id),
	).Exec(ctx)
	return user, err
}

func UpsertOneUser(ctx context.Context,
	deviceUUID string,
) (*db.UserModel, error) {
	user, err := db.Client().User.UpsertOne(
		db.User.DeviceUUID.Equals(deviceUUID),
	).Create(
		db.User.DeviceUUID.Set(deviceUUID),
		db.User.LastLogin.Set(time.Now()),
		db.User.OpenCount.Set(1),
	).Update(
		db.User.LastLogin.Set(time.Now()),
		db.User.OpenCount.Increment(1),
	).Exec(ctx)
	return user, err
}

// SetUserCoins writes a balance and the ISO week it was refilled for.
//
// Not wrapped in a transaction with the read that preceded it: two calls
// racing can only cost a handful of coins on an anonymous account, and the
// balance is refilled weekly anyway. Locking a row on every finished level
// would be a real cost for a problem measured in single coins.
func SetUserCoins(ctx context.Context, userID string, coins int, week string) error {
	_, err := db.Client().User.FindUnique(
		db.User.ID.Equals(userID),
	).Update(
		db.User.Coins.Set(coins),
		db.User.CoinsWeek.Set(week),
	).Exec(ctx)
	return err
}
