# Marcel Games Monorepo

A pnpm + Turborepo monorepo containing two Capacitor mobile apps built with
Next.js and a shared Gin API server.

## Structure

```
marcel-games/
├── apps/
│   ├── earthunt/           # Next.js 16 + Capacitor app (port 3001)
│   └── wordclimb/          # Next.js 16 + Capacitor app (port 3002)
├── packages/
│   ├── ui/                 # Shared React component library
│   └── lib/                # Shared hooks, storage, haptics utilities
├── server/                 # Go 1.23 + Gin API (marcel-games-api)
│   ├── cmd/api/main.go
│   ├── internal/
│   │   ├── config/
│   │   ├── database/
│   │   ├── handlers/
│   │   ├── middleware/
│   │   └── router/
│   ├── migrations/
│   ├── Dockerfile
│   └── fly.toml
└── .github/workflows/      # CI/CD pipelines
```

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- Go >= 1.23
- [flyctl](https://fly.io/docs/hands-on/install-flyctl/) (for server deploys)
- Android Studio / Xcode (for native builds)

## Getting started

```bash
# Install all JS dependencies
pnpm install

# Start both apps in dev mode
pnpm dev

# Start only one app
pnpm dev:earthunt
pnpm dev:wordclimb
```

### Server (local)

```bash
cd server
cp .env.example .env   # then fill in your values
go run ./cmd/api
```

## Building for mobile

```bash
# Build the static Next.js export and sync to native projects
pnpm cap:sync:earthunt
pnpm cap:sync:wordclimb

# Open in Xcode / Android Studio
pnpm --filter @marcel-games/earthunt cap:open:ios
pnpm --filter @marcel-games/earthunt cap:open:android
```

## Deployment

| Target    | Trigger                          | Workflow                      |
| --------- | -------------------------------- | ----------------------------- |
| Server    | Push to `main` touching `server/` | `server-deploy.yml` → Fly.io |
| Earthunt  | Push to `main` touching `apps/earthunt/` or `packages/` | `earthunt-mobile.yml` |
| WordClimb | Push to `main` touching `apps/wordclimb/` or `packages/` | `wordclimb-mobile.yml` |

See `.github/SECRETS.md` for required repository secrets.

## API routes

All routes are prefixed `/api/v1` and the server selects the correct database
based on the `Host` request header.

| Method | Path                      | Auth | Description                    |
| ------ | ------------------------- | ---- | ------------------------------ |
| GET    | `/health`                 | No   | Health check (pings the DB)    |
| POST   | `/api/v1/auth/signup`     | No   | Register a new user            |
| POST   | `/api/v1/auth/signin`     | No   | Sign in, returns JWT           |
| GET    | `/api/v1/profile/me`      | JWT  | Get own profile                |
| PATCH  | `/api/v1/profile/me`      | JWT  | Update username / avatar       |
| GET    | `/api/v1/leaderboard`     | No   | Top 50 scores for this app     |
| POST   | `/api/v1/leaderboard`     | JWT  | Upsert personal best           |
| POST   | `/api/v1/scores`          | JWT  | Submit a score (upserts best)  |
| GET    | `/api/v1/scores/me`       | JWT  | Get personal best              |
| GET    | `/api/v1/scores/me/history` | JWT | Paginated score history      |
