/**
 * Raises the iOS build number by one.
 *
 * App Store Connect refuses a build number it has already seen for the same
 * MARKETING_VERSION, and it refuses it *after* the upload — so forgetting this
 * costs a full archive, export and upload cycle before anything says so.
 *
 * CURRENT_PROJECT_VERSION appears once per build configuration (Debug and
 * Release) and Xcode expects them to agree, so every occurrence moves together.
 *
 *   node scripts/bump-build-number.mjs        # 14 -> 15
 *   node scripts/bump-build-number.mjs 42     # set it outright
 */
import { readFileSync, writeFileSync } from "node:fs"

const PROJECT = new URL("../ios/App/App.xcodeproj/project.pbxproj", import.meta.url).pathname
const PATTERN = /CURRENT_PROJECT_VERSION = (\d+);/g

const project = readFileSync(PROJECT, "utf8")
const current = [...project.matchAll(PATTERN)].map((m) => Number(m[1]))

if (current.length === 0) {
  console.error(`No CURRENT_PROJECT_VERSION found in ${PROJECT}.`)
  process.exit(1)
}

const requested = process.argv[2]
if (requested !== undefined && !/^\d+$/.test(requested)) {
  console.error(`"${requested}" is not a build number. Pass a positive integer, or nothing to add one.`)
  process.exit(1)
}

// Take the highest, so a project whose configurations have drifted apart comes
// back in step rather than reusing a number one of them already published.
const next = requested !== undefined ? Number(requested) : Math.max(...current) + 1

if (next <= Math.max(...current) && requested !== undefined) {
  console.error(
    `Build ${next} is not above the current ${Math.max(...current)}. ` +
      "App Store Connect only accepts a number it has not seen for this version."
  )
  process.exit(1)
}

writeFileSync(PROJECT, project.replace(PATTERN, `CURRENT_PROJECT_VERSION = ${next};`))

const marketing = project.match(/MARKETING_VERSION = ([^;]+);/)?.[1] ?? "?"
console.log(`Build ${[...new Set(current)].join("/")} -> ${next} (version ${marketing}).`)
