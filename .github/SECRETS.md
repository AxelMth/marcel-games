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

> Note: `apps-ci.yml` deploys OTA Live Updates to the **Production** channel only
> on push to `main` (and manual `workflow_dispatch`). Pull requests run lint + build
> as a gate but do not deploy.

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

## Server runtime secrets (Fly.io)

Set per app with `fly secrets set -a <app>` (`earthunt-api`, `wordclimb-api`).

| Variable | Required? | Notes |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | Postgres connection string (used by Prisma). |
| `APP_ID` | No | `EARTHUNT` or `WORDCLIMB`; only affects log tagging. Defaults to `EARTHUNT`. (`GAME_APP` is an accepted alias.) |

## Local development

- `apps/earthunt/.env.local` — copy from `.env.example`, add your Mapbox token.
- `apps/wordclimb/.env.local` — copy from `.env.example` (optional; prod API used by default).
- `server/<app>/.env` — `DATABASE_URL` for local runs (`godotenv` loads it).
