package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	Port           string
	JWTSecret      string
	DBURLEarthunt  string
	DBURLWordclimb string
	EarthuntHost   string
	WordclimbHost  string
	GinMode        string
}

// Load reads .env (if present) and returns a populated Config.
func Load() *Config {
	// .env is optional; ignore the error in production where env vars come
	// from the platform (Fly.io secrets).
	_ = godotenv.Load()

	cfg := &Config{
		Port:           getEnv("PORT", "8080"),
		JWTSecret:      mustGetEnv("JWT_SECRET"),
		DBURLEarthunt:  mustGetEnv("DATABASE_URL_EARTHUNT"),
		DBURLWordclimb: mustGetEnv("DATABASE_URL_WORDCLIMB"),
		EarthuntHost:   getEnv("EARTHUNT_HOST", "earthunt.server.com"),
		WordclimbHost:  getEnv("WORDCLIMB_HOST", "wordclimb.server.com"),
		GinMode:        getEnv("GIN_MODE", "release"),
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustGetEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("required environment variable %q is not set", key)
	}
	return v
}
