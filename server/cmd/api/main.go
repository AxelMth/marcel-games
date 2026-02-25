package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/marcelgames/marcel-games-api/internal/config"
	"github.com/marcelgames/marcel-games-api/internal/database"
	"github.com/marcelgames/marcel-games-api/internal/middleware"
	"github.com/marcelgames/marcel-games-api/internal/router"
)

func main() {
	cfg := config.Load()

	// Connect to both app databases independently
	earthuntDB, err := database.Connect(cfg.DBURLEarthunt, "earthunt")
	if err != nil {
		log.Fatalf("failed to connect to earthunt database: %v", err)
	}
	defer earthuntDB.Close()

	wordclimbDB, err := database.Connect(cfg.DBURLWordclimb, "wordclimb")
	if err != nil {
		log.Fatalf("failed to connect to wordclimb database: %v", err)
	}
	defer wordclimbDB.Close()

	// Run schema migrations on both databases
	if err := database.Migrate(earthuntDB); err != nil {
		log.Fatalf("earthunt migration failed: %v", err)
	}
	if err := database.Migrate(wordclimbDB); err != nil {
		log.Fatalf("wordclimb migration failed: %v", err)
	}

	dbs := &middleware.AppDatabases{
		Earthunt:      earthuntDB,
		Wordclimb:     wordclimbDB,
		EarthuntHost:  cfg.EarthuntHost,
		WordclimbHost: cfg.WordclimbHost,
	}

	r := router.New(dbs, cfg)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("[api] listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("[api] shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("forced shutdown: %v", err)
	}
	log.Println("[api] exited cleanly")
}
