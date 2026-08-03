/**
 * Expands the English catalogue. The curated levels-en.json held only 15
 * puzzles, far too few for a progression, while words-en.json holds 556
 * four-letter words that BFS can chain into tens of thousands of valid ladders.
 *
 * The 15 curated levels are kept first — they are the recognisable ones
 * (cold→warm, love→hate) and make a better opening than anything generated.
 * Everything after is generated, then filtered and spread across rung counts so
 * difficulty ramps instead of jumping.
 *
 * Run: pnpm --filter @marcel-games/wordclimb generate:en
 */

import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, "..", "lib", "data")

/** Levels to emit in total, curated ones included. */
const TARGET = 140
/** More rungs than this and the player is guessing blind for too long. */
const MAX_RUNGS = 5
/** How many levels to allow per (rungs) bucket, to spread the difficulty. */
const PER_BUCKET = 32

const ALPHABET = "abcdefghijklmnopqrstuvwxyz"

function neighbors(word, wordSet) {
  const out = []
  for (let i = 0; i < word.length; i++) {
    for (const c of ALPHABET) {
      if (c === word[i]) continue
      const candidate = word.slice(0, i) + c + word.slice(i + 1)
      if (wordSet.has(candidate)) out.push(candidate)
    }
  }
  return out
}

/** Shortest chain of intermediate words, or null when the two are unreachable. */
function findLadder(start, end, wordSet) {
  if (start === end) return null
  const queue = [[start, []]]
  const seen = new Set([start])
  while (queue.length > 0) {
    const [word, path] = queue.shift()
    for (const next of neighbors(word, wordSet)) {
      if (seen.has(next)) continue
      if (next === end) return path
      seen.add(next)
      queue.push([next, [...path, next]])
    }
  }
  return null
}

const words = JSON.parse(readFileSync(join(DATA_DIR, "words-en.json"), "utf-8"))
  .map((w) => w.toLowerCase())
  .filter((w) => w.length === 4)
const wordSet = new Set(words)

const curated = JSON.parse(readFileSync(join(DATA_DIR, "levels-en.json"), "utf-8"))
const curatedList = Array.isArray(curated) ? curated : (curated.levels ?? [])

const seenPairs = new Set()
const seenWords = new Set()
for (const level of curatedList) {
  seenPairs.add(`${level.beginWord}|${level.endWord}`)
  seenWords.add(level.beginWord)
  seenWords.add(level.endWord)
}

const buckets = new Map()
// Deterministic order so re-running produces the same catalogue.
const sorted = [...words].sort()

outer: for (let i = 0; i < sorted.length; i++) {
  for (let j = i + 1; j < sorted.length; j++) {
    const [start, end] = [sorted[i], sorted[j]]
    const key = `${start}|${end}`
    if (seenPairs.has(key)) continue
    // Keep begin/end words fresh so the list does not read as variations of one word.
    if (seenWords.has(start) || seenWords.has(end)) continue

    const ladder = findLadder(start, end, wordSet)
    if (!ladder || ladder.length < 1 || ladder.length > MAX_RUNGS) continue

    const bucket = buckets.get(ladder.length) ?? []
    if (bucket.length >= PER_BUCKET) continue

    bucket.push({ beginWord: start, endWord: end, wordLadder: ladder })
    buckets.set(ladder.length, bucket)
    seenPairs.add(key)
    seenWords.add(start)
    seenWords.add(end)

    const total = [...buckets.values()].reduce((n, b) => n + b.length, 0)
    if (total >= TARGET - curatedList.length) break outer
  }
}

const generated = [...buckets.entries()]
  .sort(([a], [b]) => a - b)
  .flatMap(([, bucket]) => bucket)

const all = [...curatedList, ...generated].map((level, i) => ({
  id: i + 1,
  beginWord: level.beginWord,
  endWord: level.endWord,
  wordLadder: level.wordLadder,
}))

writeFileSync(
  join(DATA_DIR, "levels-en.json"),
  JSON.stringify({ levels: all }, null, 2) + "\n"
)

const spread = [...buckets.entries()].sort(([a], [b]) => a - b)
console.log(`curated: ${curatedList.length}, generated: ${generated.length}, total: ${all.length}`)
console.log("rungs spread:", Object.fromEntries(spread.map(([k, v]) => [k, v.length])))
