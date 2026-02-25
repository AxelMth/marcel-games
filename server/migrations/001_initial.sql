-- Migration 001 — Initial schema
-- Applied automatically at startup via database.Migrate().
-- Can also be run manually against Fly Postgres:
--   fly postgres connect -a <pg-app> -d <db-name> < migrations/001_initial.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
	id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
	username      TEXT        NOT NULL UNIQUE,
	password_hash TEXT        NOT NULL,
	avatar_url    TEXT        NOT NULL DEFAULT '',
	created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scores (one best-score row per user, upserted on each game) ----------------
CREATE TABLE IF NOT EXISTS scores (
	id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	score      BIGINT      NOT NULL DEFAULT 0,
	metadata   JSONB       NOT NULL DEFAULT '{}',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS scores_score_idx ON scores (score DESC);
