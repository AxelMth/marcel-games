# Secrets & environment variables

This repo ships two Capacitor apps (earthunt, wordclimb) and two Go servers via
GitHub Actions + Ionic AppFlow + Fly.io. Below is every secret/variable and where
it lives.

## GitHub Actions repository secrets

Set these in **Settings → Secrets and variables → Actions**.

| Secret | Used by | Purpose |
| --- | --- | --- |
| `IONIC_TOKEN` | `apps-ci.yml` | AppFlow CLI auth for Live Update (OTA) builds + deploys |
| `APPFLOW_ID_EARTHUNT` | `apps-ci.yml` | AppFlow app id for earthunt (`64ef723b`) |
| `APPFLOW_ID_WORDCLIMB` | `apps-ci.yml` | AppFlow app id for wordclimb (`860819d5`) |
| `FLY_EARTHUNT_API_TOKEN` | `server-ci.yml` | `flyctl deploy` token for `earthunt-api` |
| `FLY_WORDCLIMB_API_TOKEN` | `server-ci.yml` | `flyctl deploy` token for `wordclimb-api` |

> Note: `IONIC_TOKEN` / `APPFLOW_ID_*` are no longer read by `apps-ci.yml` — the
> OTA Live Update steps were removed with the `@capacitor/live-updates` plugin.
> They stay listed here because AppFlow still builds the store binaries; the CLI
> is just no longer invoked from CI.

## Android upload key (local / never in git)

Play requires a signed bundle. The upload key has **no recovery path**: losing it
means you can never publish an update to the listing again.

| Item | Where it lives | Notes |
| --- | --- | --- |
| `upload-keystore.jks` | `apps/earthunt/android/` (gitignored) | Back up off-machine — a password manager, not this repo |
| `keystore.properties` | `apps/earthunt/android/` (gitignored) | From `keystore.properties.example`; holds the two passwords + alias |

For CI, pass the same four values as `ORG_GRADLE_PROJECT_*` environment
variables instead of the file, and inject the keystore from a base64 secret.
See the "Building an Android release locally" section of the README.

## AppFlow build environment variables

These are **not** stored in git or GitHub — set them in the AppFlow dashboard
(**Environments**), attached to each app's build. They apply to BOTH native
(store binary) builds and web (OTA) builds, because `NEXT_PUBLIC_*` values are
baked into the static export at `next build` time.

| Variable | App | Required? | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | earthunt | **Yes** | Public Mapbox token (`pk.…`). Without it the map (the whole game) is blank. URL/scope-restrict it in the Mapbox dashboard. |
| `NEXT_PUBLIC_MAPBOX_STYLE_URL` | earthunt | No | Defaults to `mapbox://styles/mapbox/light-v11`. |
| `NEXT_PUBLIC_API_BASE_URL` | both | No | Defaults to `https://earthunt-api.fly.dev` / `https://wordclimb-api.fly.dev`. Only set to override. |

## AppFlow signing credentials (dashboard, not git)

- **iOS:** Apple Distribution certificate (`.p12`) + App Store provisioning profile
  for `com.marcelgames.earthunt` and `com.marcelgames.wordclimb` (team `7H6S64378V`).
- **Android:** upload keystore enrolled in Play App Signing.

## Level-of-the-day secrets (GitHub Actions)

Each game has its own Postgres, so each cron needs its own connection string.
A single shared `DATABASE_URL` pointed both jobs at one database: one of them
wrote its levels — and pushed its schema, via `prisma db push` — into the other
game's data. The workflows now fail immediately when their secret is missing
rather than write to the wrong place.

| Secret | Used by | Notes |
| --- | --- | --- |
| `EARTHUNT_DATABASE_URL` | `plotd-earthunt.yml` | Connection string for `earthunt-api`'s Postgres. |
| `WORDCLIMB_DATABASE_URL` | `plotd-wordclimb.yml` | Connection string for `wordclimb-api`'s Postgres. |

Both jobs run weekly and fill 30 days ahead, skipping days already stored, so a
missed run costs nothing. Run one by hand from the Actions tab: leave the inputs
empty to top the window up, set `target_date` to rebuild a single day, or raise
`days` to fill further ahead.

## Server runtime secrets (Fly.io)

Set per app with `fly secrets set -a <app>` (`earthunt-api`, `wordclimb-api`).

| Variable | Required? | Notes |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | Postgres connection string (used by Prisma). Per Fly app, so the two games stay separate. |
| `APP_ID` | No | `EARTHUNT` or `WORDCLIMB`; only affects log tagging. Defaults to `EARTHUNT`. (`GAME_APP` is an accepted alias.) |

## Local development

- `apps/earthunt/.env.local` — copy from `.env.example`, add your Mapbox token.
- `apps/wordclimb/.env.local` — copy from `.env.example` (optional; prod API used by default).
- `server/<app>/.env` — `DATABASE_URL` for local runs (`godotenv` loads it).
