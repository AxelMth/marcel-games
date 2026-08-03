/**
 * Generates the level catalogue for both languages.
 *
 * Replaces the two earlier per-locale scripts, which ran a BFS per candidate
 * pair and so had to stop after a couple of hundred puzzles. scripts/lib/
 * ladder-graph.mjs enumerates every ladder in one pass per word: 92 000 French
 * and 44 000 English ladders are reachable in well under a second. The limit is
 * now a product decision, not a compute one.
 *
 * Run: pnpm --filter @marcel-games/wordclimb generate:levels
 */

import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { allLadders, buildGraph, selectSpread } from "./lib/ladder-graph.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, "..", "lib", "data")
const SOURCE_DIR = join(__dirname, "..", "data-sources")

/**
 * 1500 puzzles is roughly four years at one a day, and costs ~120 KB in the
 * bundle. Shipping all 136 000 would add ~10 MB for content nobody reaches.
 */
const PER_LOCALE = 1500
const MIN_RUNGS = 2
const MAX_RUNGS = 5
const MIN_LEN = 4
const MAX_LEN = 6

/**
 * A player should not be asked for a word they have never met. The French
 * dictionary carries these register markers inside the definition text, so no
 * extra frequency list is needed.
 */
const REJECTED_MARKERS = [
  "(Vieilli)",
  "(Désuet)",
  "(Desuet)",
  "(Archaïsme)",
  "(Archaisme)",
  "(Rare)",
  "(Argot)",
  "(Vulgaire)",
  "(Familier)",
  "(Injurieux)",
  "(Péjoratif)",
]

function frenchWords() {
  const dictionary = JSON.parse(
    readFileSync(join(SOURCE_DIR, "fr-dictionary.json"), "utf-8")
  )
  return dictionary
    .filter(
      ({ word, definition }) =>
        /^[a-z]+$/.test(word) &&
        word.length >= MIN_LEN &&
        word.length <= MAX_LEN &&
        !REJECTED_MARKERS.some((marker) => definition.includes(marker))
    )
    .map(({ word }) => word)
}

function englishWords() {
  // No English dictionary is vendored; words-en.json is the curated list the
  // original puzzles were drawn from. It is small but every word is common.
  return JSON.parse(readFileSync(join(DATA_DIR, "words-en.json"), "utf-8"))
    .map((word) => word.toLowerCase())
    .filter((word) => word.length >= MIN_LEN && word.length <= MAX_LEN)
}

function generate(words) {
  const byLength = new Map()
  for (const word of new Set(words)) {
    const list = byLength.get(word.length) ?? []
    list.push(word)
    byLength.set(word.length, list)
  }

  const ladders = []
  for (const [, list] of [...byLength].sort(([a], [b]) => a - b)) {
    if (list.length < 10) continue
    ladders.push(...allLadders(buildGraph(list.sort()), MIN_RUNGS, MAX_RUNGS))
  }
  return ladders
}

function write(locale, ladders, curated = []) {
  const curatedKeys = new Set(curated.map((l) => `${l.beginWord}|${l.endWord}`))
  const pool = ladders.filter(
    (l) => !curatedKeys.has(`${l.beginWord}|${l.endWord}`)
  )
  const selected = selectSpread(pool, { limit: PER_LOCALE - curated.length })

  const levels = [...curated, ...selected].map((level, i) => ({
    id: i + 1,
    beginWord: level.beginWord,
    endWord: level.endWord,
    wordLadder: level.wordLadder,
  }))

  writeFileSync(
    join(DATA_DIR, `levels-${locale}.json`),
    JSON.stringify({ levels }, null, 2) + "\n"
  )

  const spread = {}
  for (const level of levels) {
    const key = level.wordLadder.length
    spread[key] = (spread[key] ?? 0) + 1
  }
  console.log(
    `${locale}: ${levels.length} retenus sur ${ladders.length} possibles — ` +
      `répartition ${JSON.stringify(spread)}`
  )
}

// The recognisable English openers (cold→warm, love→hate) make a better first
// impression than anything the enumeration picks, so they stay in front.
const curatedEn = JSON.parse(
  readFileSync(join(DATA_DIR, "levels-en.json"), "utf-8")
).levels.slice(0, 15)

write("en", generate(englishWords()), curatedEn)
write("fr", generate(frenchWords()))
