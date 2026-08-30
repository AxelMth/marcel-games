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
import { randomFrom } from "./lib/seeded-random.mjs"
import { wordKey } from "./lib/word-key.mjs"

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

/**
 * Words Wiktionary defines, keyed accent-blind so the rung "cles" matches the
 * entry "clés".
 *
 * This is the abbreviation filter, and it works because of what it rejects by
 * construction. The French source is a scrape, and a quarter of its short
 * entries are "word not found" pages whose body lists near-spellings instead of
 * a definition — that is how MLLE, an abbreviation nobody can be asked to
 * guess, became a playable rung. Those pages carry no register marker, so
 * REJECTED_MARKERS never saw them.
 *
 * Rejecting on the scrape's own "not found" wording would take 658 legitimate
 * words with it (inflected forms the site has no page for). Requiring a real
 * Wiktionary entry instead removes 28 French words, and they are exactly the
 * ones that do not belong: mlle, anglicisms (back, line, sine, world),
 * latinisms (casus, facto, priori), and proper nouns (juan, xavier, airbus).
 * No hand-maintained blocklist needed.
 */
function definedWords(file) {
  const entries = JSON.parse(readFileSync(join(SOURCE_DIR, file), "utf-8"))
  return new Set(entries.map(({ word }) => wordKey(word)))
}

function frenchWords() {
  const dictionary = JSON.parse(
    readFileSync(join(SOURCE_DIR, "fr-dictionary.json"), "utf-8")
  )
  const defined = definedWords("fr-definitions.json")
  return dictionary
    .filter(
      ({ word, definition }) =>
        /^[a-z]+$/.test(word) &&
        word.length >= MIN_LEN &&
        word.length <= MAX_LEN &&
        !REJECTED_MARKERS.some((marker) => definition.includes(marker)) &&
        defined.has(wordKey(word))
    )
    .map(({ word }) => word)
}

function englishWords() {
  // No English dictionary is vendored; words-en.json is the curated list the
  // original puzzles were drawn from. It is small but every word is common.
  // The definition filter drops nothing from it today — it is here so a later
  // widening of the list cannot quietly reintroduce unguessable rungs.
  const defined = definedWords("en-definitions.json")
  return JSON.parse(readFileSync(join(DATA_DIR, "words-en.json"), "utf-8"))
    .map((word) => word.toLowerCase())
    .filter(
      (word) =>
        word.length >= MIN_LEN &&
        word.length <= MAX_LEN &&
        defined.has(wordKey(word))
    )
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

/**
 * Seeds, fixed so a rebuild reproduces this exact catalogue. One per locale so
 * the two languages do not shuffle in lockstep, and one per decision so that
 * changing how ladders are picked does not also flip which ones are reversed.
 */
const SELECTION_SEED = { en: 0x5e1ec7, fr: 0x5e1ec8 }
const FLIP_SEED = { en: 0xf119, fr: 0xf11a }

/**
 * A ladder read backwards is the same puzzle: every step still changes one
 * letter. Reversing half of them is what breaks the last alphabetical tell.
 *
 * The enumeration only ever emits a pair when the neighbour sorts after the
 * start, so beginWord came before endWord in the alphabet every single time —
 * 0 of 1312 French levels ran the other way. Nothing in the game says so, but
 * a player who noticed would know which end of the dictionary to aim for.
 */
function flipSome(ladders, random) {
  return ladders.map((ladder) =>
    random() < 0.5
      ? {
          beginWord: ladder.endWord,
          endWord: ladder.beginWord,
          wordLadder: [...ladder.wordLadder].reverse(),
        }
      : ladder
  )
}

function write(locale, ladders, curated = []) {
  const curatedKeys = new Set(curated.map((l) => `${l.beginWord}|${l.endWord}`))
  const pool = ladders.filter(
    (l) => !curatedKeys.has(`${l.beginWord}|${l.endWord}`)
  )
  const selected = selectSpread(pool, {
    limit: PER_LOCALE - curated.length,
    seed: SELECTION_SEED[locale],
  })

  // Curated levels keep their direction: cold→warm is the intended hook, and
  // warm→cold would read as a mistake. Dedup above compares undirected keys,
  // so flipping after selection cannot resurrect a curated pair.
  const flipped = flipSome(selected, randomFrom(FLIP_SEED[locale]))

  const levels = [...curated, ...flipped].map((level, i) => ({
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
