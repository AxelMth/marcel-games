/**
 * Refuses to copy a web build into the native projects when that build cannot
 * draw the map.
 *
 * `NEXT_PUBLIC_*` is inlined at build time, so the Mapbox token is frozen into
 * `out/` and there is no second chance to fix it later. The existing guard in
 * next.config.mjs only rejects an *empty* token, which lets a placeholder —
 * `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=ci-placeholder`, the value CI uses so its
 * build can run without a secret — sail straight through `cap sync` and into a
 * TestFlight build. Mapbox then answers 401, the map never loads, and every
 * level sits on a spinner forever: exactly the "app does not work" shape of the
 * guideline 2.1 rejection this app already lived through.
 *
 * Run between `next build` and `cap sync`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const OUT_DIR = new URL("../out", import.meta.url).pathname

// Mapbox public tokens are `pk.` followed by three base64url segments.
const REAL_TOKEN = /\bpk\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/

function* jsFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) yield* jsFiles(path)
    else if (path.endsWith(".js")) yield path
  }
}

let found = false
try {
  for (const file of jsFiles(OUT_DIR)) {
    if (REAL_TOKEN.test(readFileSync(file, "utf8"))) {
      found = true
      break
    }
  }
} catch (error) {
  console.error(`Could not read the build output at ${OUT_DIR}: ${error.message}`)
  console.error("Run `next build` before this check.")
  process.exit(1)
}

if (!found) {
  console.error(
    [
      "",
      "  This build carries no usable Mapbox token, so the map would never load",
      "  and every level would sit on a spinner. Refusing to sync it into the",
      "  native projects.",
      "",
      "  Most likely the build ran with the CI placeholder. Rebuild with the real",
      "  token — it lives in apps/earthunt/.env.local — and make sure no",
      "  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is set in your shell, since it would win",
      "  over the file:",
      "",
      "    pnpm --filter @marcel-games/earthunt mobile",
      "",
    ].join("\n")
  )
  process.exit(1)
}

console.log("Mapbox token present in the build output.")
