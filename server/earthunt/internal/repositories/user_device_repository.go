package repositories

import (
	"context"
	"marcel-games-backend/db"
)

func UpsertOneUserDevice(
	ctx context.Context,
	userID string,
	brand string,
	deviceType string,
	isDevice bool,
	manufacturer string,
	modelName string,
	osName string,
	osVersion string,
) (*db.UserDeviceModel, error) {
	userDevice, err := db.Client().UserDevice.UpsertOne(
		db.UserDevice.UserID.Equals(userID),
	).Create(
		db.UserDevice.Brand.Set(brand),
		db.UserDevice.DeviceType.Set(deviceType),
		db.UserDevice.IsDevice.Set(isDevice),
		db.UserDevice.Manufacturer.Set(manufacturer),
		db.UserDevice.ModelName.Set(modelName),
		db.UserDevice.OsName.Set(osName),
		db.UserDevice.OsVersion.Set(osVersion),
		db.UserDevice.User.Link(db.User.ID.Equals(userID)),
	).Update(
		db.UserDevice.Brand.Set(brand),
		db.UserDevice.DeviceType.Set(deviceType),
		db.UserDevice.IsDevice.Set(isDevice),
		db.UserDevice.Manufacturer.Set(manufacturer),
		db.UserDevice.ModelName.Set(modelName),
		db.UserDevice.OsName.Set(osName),
		db.UserDevice.OsVersion.Set(osVersion),
	).Exec(ctx)
	return userDevice, err
}
