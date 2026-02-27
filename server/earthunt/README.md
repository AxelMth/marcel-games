# marcel-games-backend


## Setup

Install dependencies

```bash
go mod tidy
```

## Development mode

```bash
gowatch -p cmd/api/main.go -o ./bin
```

## DB Schema

### Generate Prisma client

```bash
go run github.com/steebchen/prisma-client-go generate
```

### Databases

The same Prisma schema in `schema.prisma` is used for multiple games. In
production, each game has its own Postgres database and Fly app:

- **Earthunt**: API app (e.g. `marcel-games-earthunt-api`) with its own `DATABASE_URL`.
- **Wordclimb**: API app (e.g. `marcel-games-wordclimb-api`) with its own `DATABASE_URL`.

Each app runs the same Go binary but is configured via environment:

- `APP_ID` or `GAME_APP` set to `EARTHUNT` or `WORDCLIMB`.
- `DATABASE_URL` pointing at that game's Postgres database.

To create and migrate a new database (example with Fly Postgres):

```bash
# 1) Create a Postgres app (do this once per game)
fly postgres create --name marcel-games-earthunt-db --region cdg
fly postgres create --name marcel-games-wordclimb-db --region cdg

# 2) Get the DATABASE_URL for each and set it as a secret on the API apps
fly secrets set DATABASE_URL=... --app marcel-games-earthunt-api
fly secrets set DATABASE_URL=... --app marcel-games-wordclimb-api

# 3) Run migrations (same schema for both)
# From the server/ directory, with DATABASE_URL pointing at the target DB:
DATABASE_URL=postgres://... go run github.com/steebchen/prisma-client-go generate
```


