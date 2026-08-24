/**
 * Refuses to copy a web build into the native projects when that build points
 * at a backend the phone cannot reach.
 *
 * `NEXT_PUBLIC_*` is inlined at build time, so whatever API base URL was in
 * scope is frozen into `out/` and there is no second chance to fix it later. A
 * `.env.local` left pointing at `http://localhost:8080` — the value the file
 * ships as an example — sails straight through `cap sync` and into a TestFlight
 * build. Every request then fails, so no level ever loads and the app sits on a
 * spinner: exactly the "app does not work" shape of the guideline 2.1 rejection
 * earthunt already lived through, which is why it grew the same guard.
 *
 * Run between `next build` and `cap sync`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const OUT_DIR = new URL("../out", import.meta.url).pathname

// Anything that only resolves on the build machine.
const LOCAL_HOST = /https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?/

function* jsFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) yield* jsFiles(path)
    else if (path.endsWith(".js")) yield path
  }
}

let offender = null
try {
  for (const file of jsFiles(OUT_DIR)) {
    const match = readFileSync(file, "utf8").match(LOCAL_HOST)
    if (match) {
      offender = match[0]
      break
    }
  }
} catch (error) {
  console.error(`Could not read the build output at ${OUT_DIR}: ${error.message}`)
  console.error("Run `next build` before this check.")
  process.exit(1)
}

if (offender) {
  console.error(
    [
      "",
      `  This build has ${offender} baked into it, which resolves to nothing on`,
      "  a phone. Every API call would fail and no level would ever load.",
      "  Refusing to sync it into the native projects.",
      "",
      "  Most likely apps/wordclimb/.env.local sets NEXT_PUBLIC_API_BASE_URL to a",
      "  local server. Unset it — with no value the client falls back to the",
      "  production API — and make sure nothing in your shell overrides it, since",
      "  that would win over the file:",
      "",
      "    pnpm --filter @marcel-games/wordclimb ios:prepare",
      "",
    ].join("\n")
  )
  process.exit(1)
}

console.log("No local-only API base URL in the build output.")
