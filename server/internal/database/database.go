package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq" // Postgres driver
)

// DB wraps a sql.DB with a label for logging.
type DB struct {
	*sql.DB
	Label string
}

// Connect opens a Postgres connection pool and verifies connectivity.
func Connect(dsn, label string) (*DB, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("opening %s database: %w", label, err)
	}

	// Connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("pinging %s database: %w", label, err)
	}

	log.Printf("[db] connected to %s", label)
	return &DB{DB: db, Label: label}, nil
}

// Migrate runs embedded SQL migrations on the given database.
// Migrations are idempotent (CREATE TABLE IF NOT EXISTS).
func Migrate(db *DB) error {
	_, err := db.Exec(schema)
	if err != nil {
		return fmt.Errorf("migrating %s: %w", db.Label, err)
	}
	log.Printf("[db] migrations applied to %s", db.Label)
	return nil
}

// schema is the canonical DDL for both app databases.
// All tables are created with IF NOT EXISTS so re-runs are safe.
const schema = `
CREATE TABLE IF NOT EXISTS users (
	id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
	username      TEXT        NOT NULL UNIQUE,
	password_hash TEXT        NOT NULL,
	avatar_url    TEXT        NOT NULL DEFAULT '',
	created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scores (
	id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	score      BIGINT      NOT NULL DEFAULT 0,
	metadata   JSONB       NOT NULL DEFAULT '{}',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS scores_score_idx ON scores (score DESC);
`
