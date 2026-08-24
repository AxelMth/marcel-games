/**
 * Archives into the folder Xcode's Organizer reads, rather than into `build/`.
 *
 * `ios:archive` passes `-archivePath build/<App>.xcarchive` because `ios:export`
 * then turns that into an `.ipa` for a command-line upload. The cost is that the
 * archive never appears in Xcode → Window → Organizer, which only ever lists
 * `~/Library/Developer/Xcode/Archives/<date>/`. Someone opening Xcode to hit
 * "Distribute App" finds an empty list and no hint as to why.
 *
 * So this is the same archive, written where the GUI looks. Use it when you want
 * to upload from Xcode; use `ios:archive` + `ios:export` when you want an `.ipa`
 * on disk. Both produce identical builds.
 *
 *   node scripts/archive-to-organizer.mjs
 */
import { execFileSync } from "node:child_process"
import { mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

/** Shown as the archive's folder name; the Organizer groups by the app itself. */
const APP_NAME = "EartHunt"
const PROJECT = "ios/App/App.xcodeproj"
const SCHEME = "App"

const now = new Date()
const pad = (n) => String(n).padStart(2, "0")
const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
// Matches the shape Xcode itself uses, so the folder sorts alongside the rest.
const stamp = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}, ${pad(now.getHours())}.${pad(now.getMinutes())}`

const dir = join(homedir(), "Library/Developer/Xcode/Archives", day)
const archivePath = join(dir, `${APP_NAME} ${stamp}.xcarchive`)

mkdirSync(dir, { recursive: true })

console.log(`Archiving to ${archivePath}`)
execFileSync(
  "xcodebuild",
  [
    "-project", PROJECT,
    "-scheme", SCHEME,
    "-configuration", "Release",
    "-destination", "generic/platform=iOS",
    "-archivePath", archivePath,
    "-allowProvisioningUpdates",
    "archive",
  ],
  { stdio: "inherit" }
)

console.log("")
console.log(`Done. Xcode → Window → Organizer → Archives now lists it under ${APP_NAME}.`)
console.log('From there: "Distribute App" → "TestFlight & App Store".')
