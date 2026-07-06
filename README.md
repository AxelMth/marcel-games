# Marcel Games Monorepo

A pnpm + Turborepo monorepo containing two Capacitor mobile apps built with
Next.js 16, shared UI/lib packages, and a Go + Gin API server per app.

## Structure

```
marcel-games/
├── apps/
│   ├── earthunt/           # Next.js 16 + Capacitor app (dev port 3001) — uses Mapbox + AdMob
│   └── wordclimb/          # Next.js 16 + Capacitor app (dev port 3000) — ad-free word game
├── packages/
│   ├── ui/                 # Shared React component library
│   └── lib/                # Shared hooks, storage, haptics, AdMob, device utilities
├── server/
│   ├── earthunt/           # Go 1.23 + Gin API → Fly.io app `earthunt-api`
│   │   ├── cmd/api/main.go
│   │   ├── cmd/populate-level-of-the-day/
│   │   ├── internal/{config,handlers,...}
│   │   ├── schema.prisma
│   │   ├── Dockerfile
│   │   └── fly.toml
│   └── wordclimb/          # Same shape → Fly.io app `wordclimb-api`
├── appflow.config.json     # Ionic AppFlow build config (per app)
└── .github/workflows/      # CI/CD pipelines (see Deployment below)
```

Each game runs its **own** API + Postgres database as a separate Fly.io app. The
client picks the backend via `NEXT_PUBLIC_API_BASE_URL` (distinct domain per app);
there is no Host-header-based routing.

## Prerequisites

- Node.js >= 20
- pnpm >= 9 (via `corepack enable`)
- Go >= 1.23
- [flyctl](https://fly.io/docs/hands-on/install-flyctl/) (for server deploys)
- Android Studio / Xcode (for native builds)

## Getting started

```bash
pnpm install

# Start both apps in dev mode
pnpm dev

# Or one app
pnpm dev:earthunt   # http://localhost:3001
pnpm dev:wordclimb  # http://localhost:3000
```

For earthunt, copy `apps/earthunt/.env.example` to `.env.local` and add a Mapbox
token, or the map will not render. See [`.github/SECRETS.md`](.github/SECRETS.md).

### Server (local)

```bash
cd server/earthunt
cp .env.example .env   # set DATABASE_URL
go run ./cmd/api       # listens on :8080
```

## Building for mobile

```bash
# Static export + sync into the native projects (runs `next build && npx cap sync`)
pnpm --filter @marcel-games/earthunt mobile
pnpm --filter @marcel-games/wordclimb mobile

# Open the native projects
npx --prefix apps/earthunt cap open ios
npx --prefix apps/earthunt cap open android
```

The native `ios/` and `android/` projects are committed to git (AppFlow builds
from them). Web assets are statically exported to `out/` (`output: "export"`) and
embedded via Capacitor `webDir: "out"`.

## Deployment

| Target | Trigger | Workflow | What it does |
| --- | --- | --- | --- |
| Servers | Push to `main` touching `server/**` | `server-ci.yml` | Test + `flyctl deploy` to `earthunt-api` / `wordclimb-api` |
| Apps (OTA) | Push to `main` touching `apps/**` or `packages/**` | `apps-ci.yml` | Lint/build, then AppFlow **Live Update** (OTA) to the Production channel |
| Level-of-the-day | Daily cron | `plotd-earthunt.yml`, `plotd-wordclimb.yml` | Populate the daily level in each DB |

**Store binaries** (the `.ipa` / `.aab` you submit to the App Store / Play Store)
are built by **AppFlow native builds**, triggered from the AppFlow dashboard/CLI —
not by these workflows. See `appflow.config.json` and [`.github/SECRETS.md`](.github/SECRETS.md).

See [`.github/SECRETS.md`](.github/SECRETS.md) for all required secrets and env vars.

## API routes

The server is anonymous and device-identity based (no auth/JWT). All routes are at
the root path; the base URL differs per game.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/launch` | Register/identify a device, returns a `userId` |
| GET | `/progress` | Get a user's progress (`?userId=`) |
| GET | `/profile` | Get a user's profile + stats (`?userId=`) |
| GET | `/level` | Get the current level (`?userId=&gameMode=&continent=&level=`) |
| POST | `/level` | Finish a level, returns the next level |
| POST | `/end-level` | Deprecated alias of `POST /level` |
