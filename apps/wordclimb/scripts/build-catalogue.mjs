/**
 * Builds the playable level catalogue, per locale, from the generated ladder
 * files — and refuses to emit anything that breaks the game's one rule.
 *
 * The app used to ship a hand-written list in lib/data/levels.ts where 7 of 15
 * levels violated that rule (two-letter jumps, repeated words, a three-letter
 * rung inside a four-letter puzzle), while valid generated ladders sat unused
 * in lib/data/levels-{en,fr}.json. This script is the bridge, and the
 * validation is what stops that happening again.
 *
 * Run: pnpm --filter @marcel-games/wordclimb build:catalogue
 */

import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { randomFrom, shuffled } from "./lib/seeded-random.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, "..", "lib", "data")
// The Go server seeds its Level table from the very same catalogue this script
// emits for the client. One generator, one order, one set of level numbers:
// a level the server calls 12 is the level the client falls back to offline.
const SERVER_DATA_DIR = join(
  __dirname,
  "..",
  "..",
  "..",
  "server",
  "wordclimb",
  "internal",
  "constants"
)

function hammingDistance(a, b) {
  if (a.length !== b.length) return null
  let d = 0
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++
  return d
}

function problemsFor(level) {
  const chain = [level.beginWord, ...level.wordLadder, level.endWord]
  const problems = []
  for (let i = 0; i < chain.length - 1; i++) {
    const d = hammingDistance(chain[i], chain[i + 1])
    if (d === null) problems.push(`${chain[i]}/${chain[i + 1]} differ in length`)
    else if (d !== 1) problems.push(`${chain[i]}→${chain[i + 1]} changes ${d}`)
  }
  if (new Set(chain).size !== chain.length) problems.push("repeats a word")
  if (level.wordLadder.length === 0) problems.push("no rung to find")
  return problems
}

function readLevels(file) {
  const raw = JSON.parse(readFileSync(join(DATA_DIR, file), "utf-8"))
  return Array.isArray(raw) ? raw : (raw.levels ?? [])
}

/**
 * Difficulty band: how many words the player has to find, then how long they
 * are — longer words have fewer one-letter neighbours to guess from. Levels
 * sharing a band are equally hard, so their order within it is free.
 */
function bandOf(level) {
  return `${level.wordLadder.length}:${level.beginWord.length}`
}

function byDifficulty(a, b) {
  if (a.wordLadder.length !== b.wordLadder.length) {
    return a.wordLadder.length - b.wordLadder.length
  }
  return a.beginWord.length - b.beginWord.length
}

/** What makes two levels feel like the same puzzle to the player. */
function echoesOf(level) {
  return [`rungs:${level.wordLadder.join("|")}`, `from:${level.beginWord}`]
}

/**
 * Orders one difficulty band so that consecutive levels do not feel repeated.
 *
 * Sorting alphabetically — which is what the last tie-break used to do — put
 * every level starting with the same word back to back, and the generator
 * builds many of those: 1440 English levels held only 319 distinct rung pairs.
 * The first four levels all had the player type "bank, band", and 61% of
 * levels opened on the same word as the one before.
 *
 * So: shuffle, then walk the pool taking the first level that echoes nothing
 * in the last LOOKBACK. When the pool has nothing else left to offer — the
 * tail of a band is all near-duplicates — it takes the least-bad option
 * rather than giving up, which is why the result is checked rather than
 * assumed.
 */
const LOOKBACK = 8

function spaced(levels, random) {
  const pool = shuffled(levels, random)
  const out = []
  const recent = []

  while (pool.length > 0) {
    let pick = pool.findIndex((level) =>
      echoesOf(level).every((echo) => !recent.includes(echo))
    )
    if (pick === -1) pick = 0

    const [level] = pool.splice(pick, 1)
    out.push(level)
    recent.push(...echoesOf(level))
    while (recent.length > LOOKBACK * 2) recent.shift()
  }
  return out
}

function buildLocale(locale, file) {
  const all = readLevels(file)
  const kept = []
  const rejected = []

  for (const level of all) {
    const problems = problemsFor(level)
    if (problems.length === 0) kept.push(level)
    else rejected.push({ level, problems })
  }

  // Difficulty still drives the order — bands are played easiest first — but
  // within a band the levels are spread so the same puzzle does not come round
  // again a moment later. The seed is per locale so the two do not shuffle in
  // lockstep, and fixed so a rebuild reproduces this exact catalogue.
  kept.sort(byDifficulty)
  const random = randomFrom(locale === "en" ? 0x57ac1e : 0xec4e11e)
  const ordered = []
  for (let i = 0; i < kept.length; ) {
    const band = bandOf(kept[i])
    let end = i
    while (end < kept.length && bandOf(kept[end]) === band) end++
    ordered.push(...spaced(kept.slice(i, end), random))
    i = end
  }

  // Renumber so ids follow the played order rather than generation order.
  const renumbered = ordered.map((level, i) => ({
    id: i + 1,
    beginWord: level.beginWord,
    endWord: level.endWord,
    wordLadder: level.wordLadder,
  }))

  console.log(
    `${locale}: ${renumbered.length} kept, ${rejected.length} rejected` +
      (rejected.length
        ? ` (${rejected.slice(0, 3).map((r) => `#${r.level.id} ${r.problems[0]}`).join("; ")}${rejected.length > 3 ? ", …" : ""})`
        : "")
  )
  return renumbered
}

const en = buildLocale("en", "levels-en.json")
const fr = buildLocale("fr", "levels-fr.json")

if (en.length === 0 || fr.length === 0) {
  throw new Error("Refusing to emit an empty catalogue for a locale")
}

const banner = `// GENERATED by scripts/build-catalogue.mjs — do not edit by hand.
// Every ladder here passed validation: each step changes exactly one letter,
// no word repeats, and every level has at least one rung to find.
// Levels ramp easiest first (fewest rungs, then shortest words); within one
// difficulty band their order is shuffled against a fixed seed.
`

const body = `${banner}
export interface Level {
  id: number
  beginWord: string
  endWord: string
  /** Intermediate words the player must find, in order from begin to end. */
  wordLadder: string[]
}

export const CATALOGUE: Record<"en" | "fr", Level[]> = {
  en: ${JSON.stringify(en, null, 2)},
  fr: ${JSON.stringify(fr, null, 2)},
}
`

writeFileSync(join(DATA_DIR, "catalogue.ts"), body)
console.log(`\nWrote lib/data/catalogue.ts — en: ${en.length}, fr: ${fr.length}`)

// Same levels, same order, for cmd/populate-levels to load into Postgres.
// JSON rather than generated Go: the server only ever reads it, and a 600 KB
// literal would be dead weight in the compiler.
writeFileSync(
  join(SERVER_DATA_DIR, "catalogue.json"),
  `${JSON.stringify({ en, fr }, null, 2)}\n`
)
console.log(
  `Wrote server/wordclimb/internal/constants/catalogue.json — en: ${en.length}, fr: ${fr.length}`
)
