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

### Building for TestFlight (iOS)

**One-time setup.** Signing certificates cannot be created from the command
line: open Xcode → Settings → Accounts, sign in with the Apple Developer
account, and select the team (`7H6S64378V`). Without this,
`security find-identity -v -p codesigning` reports `0 valid identities` and
every archive fails with *"No profiles for 'com.marcelgames.earthunt' were
found"*.

Also bump the build number in `ios/App/App.xcodeproj` before each upload:
App Store Connect rejects a `CURRENT_PROJECT_VERSION` it has already seen for
the same `MARKETING_VERSION`.

```bash
pnpm --filter @marcel-games/earthunt ios:prepare
pnpm --filter @marcel-games/earthunt ios:archive
pnpm --filter @marcel-games/earthunt ios:export
```

`ios:prepare` regenerates `Env.xcconfig` from `.env.local` (so the Mapbox token
is inlined), rebuilds the static export and syncs it into the native project.
The `.ipa` lands in `apps/earthunt/build/ipa/`.

Signing is automatic, which means the *archive* is signed with the development
identity and the *export* re-signs it for distribution using the `method` in
`ios/ExportOptions.plist`. Do not "fix" the archive by forcing
`CODE_SIGN_IDENTITY = "Apple Distribution"` in Release: with automatic signing
Xcode rejects it outright — *"App is automatically signed for development, but
a conflicting code signing identity Apple Distribution has been manually
specified."*

Upload it with Apple's Transporter app, or from the terminal with an App Store
Connect API key:

```bash
xcrun altool --upload-app -f apps/earthunt/build/ipa/App.ipa -t ios --apiKey <KEY_ID> --apiIssuer <ISSUER_ID>
```

TestFlight then takes a few minutes to process the build before it appears on
the device.

### Building an Android release locally

Toolchain (once per machine — no Android Studio needed):

```bash
brew install openjdk@21 && brew install --cask android-commandlinetools
```

Then point Gradle at the SDK and install the platform:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
yes | sdkmanager --licenses
sdkmanager --install "platform-tools" "platforms;android-36" "build-tools;36.0.0"
echo "sdk.dir=$ANDROID_HOME" > apps/earthunt/android/local.properties
```

**Upload key.** Play requires a signed bundle, and the upload key has no
recovery path: lose it and you can never update the app again — you would have
to publish a brand-new listing. Generate it once, then back up both the `.jks`
and its passwords in a password manager (never in this repo — `*.jks` and
`keystore.properties` are gitignored):

`keytool` ships with the JDK, but the `openjdk@21` formula is keg-only — it is
not on `PATH`, so call it through `JAVA_HOME` (exported above):

```bash
"$JAVA_HOME/bin/keytool" -genkeypair -v -keystore apps/earthunt/android/upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Copy `apps/earthunt/android/keystore.properties.example` to
`keystore.properties` and fill in the passwords you just chose. Then build the
bundle to upload:

```bash
pnpm --filter @marcel-games/earthunt mobile
cd apps/earthunt/android && ./gradlew bundleRelease
```

The `.aab` lands in `app/build/outputs/bundle/release/`. `bundleRelease` fails
fast with an explicit message if `keystore.properties` is missing, rather than
silently producing an unsigned or debug-signed bundle that Play would reject.

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
