#!/usr/bin/env bash
#
# Applies schema.prisma to the database in DATABASE_URL.
#
# Two passes on purpose. `prisma db push` refuses, and changes nothing, as soon
# as the diff carries anything it labels "data loss" — and that label covers far
# more than deletions: adding a unique constraint earns it too, because the
# statement fails if duplicates already exist. That is what silently froze
# WordClimb's schema for weeks. A `@@unique([date, locale])` on LevelOfTheDay
# stopped the weekly job, so three columns that shipped with the API were never
# created, and every /profile request answered 500 with
# "The column LevelHistory.beginWord does not exist in the current database".
#
# So: strict first, which is what an additive change should need. Only if that
# refuses do we re-run with --accept-data-loss, and the refused run has already
# printed the full warning list to the log by then — that listing is the record
# of what the second pass went on to accept.
#
# The trade-off is deliberate and worth stating: the second pass accepts *any*
# warning, a dropped column included. Renaming a field in schema.prisma is
# therefore a destructive operation here, because `db push` reads a rename as a
# drop plus an add. Check the warning list in the job log after a deploy that
# changed the schema.
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "::error::DATABASE_URL is not set."
  exit 1
fi

PRISMA="go run github.com/steebchen/prisma-client-go"

if $PRISMA db push; then
  echo "Schema applied; the diff needed no warnings accepted."
  exit 0
fi

echo "::warning::db push refused the diff. Re-running with --accept-data-loss — the warning list it just printed is what this accepts."
$PRISMA db push --accept-data-loss
