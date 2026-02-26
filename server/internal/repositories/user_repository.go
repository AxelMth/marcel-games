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
