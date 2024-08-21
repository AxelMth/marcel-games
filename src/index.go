package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"prisma/db"
	"time"
)

var client *db.PrismaClient

func init() {
    var err error
    client = db.NewClient()
    if err = client.Prisma.Connect(); err != nil {
        log.Fatalf("failed to connect to database: %v", err)
    }
}

func main() {
    defer func() {
        if err := client.Prisma.Disconnect(); err != nil {
            log.Fatalf("failed to disconnect from database: %v", err)
        }
    }()

    http.HandleFunc("/launch", launchHandler)
    http.HandleFunc("/next-level", nextLevelHandler)

    fmt.Println("Starting server at port 8080")
    if err := http.ListenAndServe(":8080", nil); err != nil {
        log.Fatal(err)
    }
}

type LaunchRequest struct {
    UUID         string `json:"uuid"`
    Brand        string `json:"brand"`
    DeviceType   string `json:"deviceType"`
    IsDevice     bool   `json:"isDevice"`
    Manufacturer string `json:"manufacturer"`
    ModelName    string `json:"modelName"`
    OsName       string `json:"osName"`
    OsVersion    string `json:"osVersion"`
}

func launchHandler(w http.ResponseWriter, r *http.Request) {
    var req LaunchRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid request payload", http.StatusBadRequest)
        return
    }

    ctx := context.Background()

    user, err := client.User.UpsertOne(
        db.User.ID.Equals(req.UUID),
    ).Update(
        db.User.LastLogin.Set(time.Now()),
        db.User.OpenCount.Increment(1),
    ).Create(
        db.User.LastLogin.Set(time.Now()),
        db.User.OpenCount.Set(1),
    ).Exec(ctx)

    if err != nil {
        fmt.Println(err)
        http.Error(w, "Failed to update user", http.StatusInternalServerError)
        return
    }
    

    _, err = client.UserDevice.UpsertOne(
        db.UserDevice.UserID.Equals(user.ID),
    ).Create(
        db.UserDevice.Brand.Set(req.Brand),
        db.UserDevice.DeviceType.Set(req.DeviceType),
        db.UserDevice.IsDevice.Set(req.IsDevice),
        db.UserDevice.Manufacturer.Set(req.Manufacturer),
        db.UserDevice.ModelName.Set(req.ModelName),
        db.UserDevice.OsName.Set(req.OsName),
        db.UserDevice.OsVersion.Set(req.OsVersion),
        db.UserDevice.User.Link(
            db.User.ID.Equals(user.ID),
        ),
    ).Update(
        db.UserDevice.Brand.Set(req.Brand),
        db.UserDevice.DeviceType.Set(req.DeviceType),
        db.UserDevice.IsDevice.Set(req.IsDevice),
        db.UserDevice.Manufacturer.Set(req.Manufacturer),
        db.UserDevice.ModelName.Set(req.ModelName),
        db.UserDevice.OsName.Set(req.OsName),
        db.UserDevice.OsVersion.Set(req.OsVersion),
    ).Exec(ctx)

    if err != nil {
        http.Error(w, "Failed to create user device", http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(user)
}

type NextLevelRequest struct {
    UserID    string `json:"userId"`
    Attempts  int `json:"attempts"`
    TimeSpent int `json:"timeSpent"`
}

func nextLevelHandler(w http.ResponseWriter, r *http.Request) {
    var req NextLevelRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid request payload", http.StatusBadRequest)
        return
    }

    ctx := context.Background()

    levelHistories, err := client.LevelHistory.FindMany(
        db.LevelHistory.UserID.Equals(req.UserID),
    ).Exec(ctx)

    if err != nil {
        http.Error(w, "InternalError", http.StatusInternalServerError)
    }

    var currentLevel int
    if (len(levelHistories) == 0) {
        currentLevel = 1
    } else {
        currentLevel = levelHistories[len(levelHistories)-1].Level + 1
    }

    rank :=  calculateRank(req.Attempts, req.TimeSpent)
    _, err = client.LevelHistory.CreateOne(
        db.LevelHistory.Level.Set(currentLevel),
        db.LevelHistory.Attempts.Set(req.Attempts),
        db.LevelHistory.TimeSpent.Set(req.TimeSpent),
        db.LevelHistory.Rank.Set(rank),
        db.LevelHistory.User.Link(
            db.User.ID.Equals(req.UserID),
        ),
    ).Exec(ctx)

    if err != nil {
        fmt.Println(err)
        http.Error(w, "Failed to create level history", http.StatusInternalServerError)
        return
    }

    nextLevel := currentLevel + 1
    response := map[string]int{"next_level": nextLevel, "rank": rank}
    json.NewEncoder(w).Encode(response)
}

func calculateRank(attempts, timeSpent int) int {
    return 100 - (attempts * 2) - (timeSpent / 10)
}