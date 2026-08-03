/**
 * Generates the French catalogue from the bundled dictionary.
 *
 * The previous levels-fr.json was usable but dull: 180 of its 270 puzzles had a
 * single word to find, and two thirds were built on 7–8 letter words, which in
 * French means conjugation variants (abregee → abreger, absence → absents).
 * Guessing one inflected form from another is not a word ladder, it is spelling.
 *
 * This generator keeps short words, demands at least two rungs, and drops words
 * the dictionary itself flags as rare, dated or coarse — those markers are in
 * the definition text, so no extra data source is needed.
 *
 * Run: pnpm --filter @marcel-games/wordclimb generate:fr
 */

import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, "..", "lib", "data")
const SOURCE_DIR = join(__dirname, "..", "data-sources")

const TARGET = 220
const MIN_LEN = 4
const MAX_LEN = 6
const MIN_RUNGS = 2
const MAX_RUNGS = 5
/** Cap per rung count so the progression ramps instead of piling up on one tier. */
const PER_BUCKET = 55

/** A player should not be asked for a word they have never met. */
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

/**
 * Shortest chain of intermediate words. Substitutions only — the old FR
 * generator passed a mixed-length word set to a neighbour function that also
 * produced insertions and deletions, which is how nine ladders ended up
 * changing word length mid-climb.
 */
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

const dictionary = JSON.parse(
  readFileSync(join(SOURCE_DIR, "fr-dictionary.json"), "utf-8")
)

const usable = new Map()
for (const { word, definition } of dictionary) {
  if (!/^[a-z]+$/.test(word)) continue
  if (word.length < MIN_LEN || word.length > MAX_LEN) continue
  if (REJECTED_MARKERS.some((marker) => definition.includes(marker))) continue
  usable.set(word, definition)
}

console.log(`dictionnaire : ${usable.size} mots retenus (${MIN_LEN}–${MAX_LEN} lettres, hors rares/familiers)`)

const byLength = new Map()
for (const word of usable.keys()) {
  const list = byLength.get(word.length) ?? []
  list.push(word)
  byLength.set(word.length, list)
}

const buckets = new Map()
const usedWords = new Set()
let total = 0

outer: for (const [, list] of [...byLength.entries()].sort(([a], [b]) => a - b)) {
  const wordSet = new Set(list)
  const sorted = [...list].sort()
  for (let i = 0; i < sorted.length; i++) {
    if (usedWords.has(sorted[i])) continue
    for (let j = i + 1; j < sorted.length; j++) {
      if (usedWords.has(sorted[j])) continue
      const ladder = findLadder(sorted[i], sorted[j], wordSet)
      if (!ladder || ladder.length < MIN_RUNGS || ladder.length > MAX_RUNGS) continue

      const bucket = buckets.get(ladder.length) ?? []
      if (bucket.length >= PER_BUCKET) continue

      bucket.push({ beginWord: sorted[i], endWord: sorted[j], wordLadder: ladder })
      buckets.set(ladder.length, bucket)
      // Keep every word to one puzzle so the list does not read as variations.
      usedWords.add(sorted[i])
      usedWords.add(sorted[j])
      for (const rung of ladder) usedWords.add(rung)

      total++
      if (total >= TARGET) break outer
      break
    }
  }
}

const levels = [...buckets.entries()]
  .sort(([a], [b]) => a - b)
  .flatMap(([, bucket]) => bucket)
  .map((level, i) => ({ id: i + 1, ...level }))

writeFileSync(
  join(DATA_DIR, "levels-fr.json"),
  JSON.stringify({ levels }, null, 2) + "\n"
)

const spread = [...buckets.entries()].sort(([a], [b]) => a - b)
console.log(`écrit ${levels.length} niveaux`)
console.log("mots à deviner :", Object.fromEntries(spread.map(([k, v]) => [k, v.length])))
