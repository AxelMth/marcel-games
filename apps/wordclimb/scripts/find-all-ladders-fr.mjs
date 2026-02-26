/**
 * Find all possible word ladders in French using word_data.json.
 * Builds a graph by word length, finds connected components, then outputs:
 * - all-ladder-pairs-fr.json: summary + pairs per length that have a ladder
 * - levels-fr.json: playable levels (one ladder per component, with wordLadder filled)
 *
 * Run: node apps/wordclimb/scripts/find-all-ladders-fr.mjs
 */

import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, "..", "lib", "data")

const MIN_LEN = 3
const MAX_LEN = 8
const MAX_LEVELS_TO_COMPUTE = 2000 // max levels with full wordLadder to write
const MAX_PAIRS_PER_LENGTH = 5000 // cap pairs stored per length (to keep JSON small)

// ----- Helpers -----
function getNeighbors(word, wordSet, len) {
  const normalized = word.toLowerCase()
  const neighbors = []
  const alphabet = "abcdefghijklmnopqrstuvwxyz"
  for (let i = 0; i < normalized.length; i++) {
    for (const c of alphabet) {
      if (c === normalized[i]) continue
      const candidate = normalized.slice(0, i) + c + normalized.slice(i + 1)
      if (wordSet.has(candidate)) neighbors.push(candidate)
    }
  }
  return neighbors
}

function findLadder(start, end, wordSet) {
  const s = start.toLowerCase()
  const e = end.toLowerCase()
  if (s.length !== e.length) return null
  if (s === e) return []
  if (!wordSet.has(s) || !wordSet.has(e)) return null
  const len = s.length
  const filteredSet = new Set(
    [...wordSet].filter((w) => w.length === len && w.toLowerCase() === w)
  )
  if (!filteredSet.has(s) || !filteredSet.has(e)) return null
  const queue = [{ word: s, path: [] }]
  const visited = new Set([s])
  while (queue.length > 0) {
    const { word, path } = queue.shift()
    const neighbors = getNeighbors(word, filteredSet, len)
    for (const next of neighbors) {
      if (visited.has(next)) continue
      visited.add(next)
      const newPath = [...path, next]
      if (next === e) return path
      queue.push({ word: next, path: newPath })
    }
  }
  return null
}

/** Find connected components in the graph of words (same length, one-letter apart) */
function findComponents(wordsOfLen) {
  const wordSet = new Set(wordsOfLen)
  const len = wordsOfLen[0]?.length ?? 0
  const visited = new Set()
  const components = []
  for (const w of wordsOfLen) {
    if (visited.has(w)) continue
    const component = []
    const queue = [w]
    visited.add(w)
    while (queue.length > 0) {
      const word = queue.shift()
      component.push(word)
      const neighbors = getNeighbors(word, wordSet, len)
      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.add(n)
          queue.push(n)
        }
      }
    }
    components.push(component)
  }
  return components
}

function loadWordsFromWordData() {
  const raw = readFileSync(join(DATA_DIR, "word_data.json"), "utf-8")
  const data = JSON.parse(raw)
  return data
    .map((entry) => (entry.word || "").trim().toLowerCase())
    .filter((w) => w.length >= MIN_LEN && w.length <= MAX_LEN)
}

function main() {
  console.log("Loading word_data.json...")
  const allWords = loadWordsFromWordData()
  const uniqueWords = [...new Set(allWords)]
  console.log("Unique words (length", MIN_LEN, "-", MAX_LEN + "):", uniqueWords.length)

  const byLength = new Map()
  for (const w of uniqueWords) {
    const L = w.length
    if (!byLength.has(L)) byLength.set(L, [])
    byLength.get(L).push(w)
  }

  const summary = []
  const allPairsByLength = {}
  const componentsByLength = {}
  const levelsToCompute = [] // [ { beginWord, endWord, length } ]

  for (const [len, words] of byLength) {
    const L = words.length
    console.log("Length", len + ":", L, "words, finding components...")
    const components = findComponents(words)
    const totalPairs = components.reduce((s, c) => s + (c.length * (c.length - 1)) / 2, 0)
    summary.push({ length: len, words: L, components: components.length, pairsWithLadder: totalPairs })
    componentsByLength[len] = components.map((c) => c.sort())

    const pairs = []
    for (const comp of components) {
      if (comp.length < 2) continue
      for (let i = 0; i < comp.length; i++) {
        for (let j = i + 1; j < comp.length; j++) {
          if (pairs.length < MAX_PAIRS_PER_LENGTH) {
            pairs.push({ beginWord: comp[i], endWord: comp[j] })
          }
        }
      }
      if (levelsToCompute.length < MAX_LEVELS_TO_COMPUTE) {
        levelsToCompute.push({ beginWord: comp[0], endWord: comp[comp.length - 1], length: len })
      }
    }
    allPairsByLength[len] = pairs
    console.log("  ->", components.length, "components,", totalPairs, "pairs")
  }

  const totalPairsAll = summary.reduce((s, x) => s + x.pairsWithLadder, 0)
  console.log("\nTotal pairs that have a ladder:", totalPairsAll)

  writeFileSync(
    join(DATA_DIR, "all-ladder-pairs-fr.json"),
    JSON.stringify(
      {
        summary: { totalPairsWithLadder: totalPairsAll, byLength: summary },
        pairsByLength: allPairsByLength,
        componentsByLength: componentsByLength,
      },
      null,
      2
    ),
    "utf-8"
  )
  console.log("Wrote all-ladder-pairs-fr.json")

  const fullWordSet = new Set(uniqueWords)
  const levels = []
  let id = 1
  for (const { beginWord, endWord } of levelsToCompute.slice(0, MAX_LEVELS_TO_COMPUTE)) {
    const ladder = findLadder(beginWord, endWord, fullWordSet)
    if (!ladder || ladder.length === 0) continue
    levels.push({ id: id++, beginWord, endWord, wordLadder: ladder })
  }

  writeFileSync(
    join(DATA_DIR, "levels-fr.json"),
    JSON.stringify({ levels }, null, 2),
    "utf-8"
  )
  console.log("Wrote levels-fr.json with", levels.length, "levels (with wordLadder)")
}

main()
