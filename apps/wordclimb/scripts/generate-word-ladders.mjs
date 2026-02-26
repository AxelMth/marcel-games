/**
 * Generates word ladders using BFS and words from word_data.json.
 * word_data.json: array of { word, definition }; the "word" key is used as the dictionary.
 * Run: node apps/wordclimb/scripts/generate-word-ladders.mjs
 */

import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, "..", "lib", "data")

// ----- Word ladder (BFS) -----
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
  const filteredSet = new Set([...wordSet].filter((w) => w.length === len && w.toLowerCase() === w))
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

function toWordSet(words) {
  const set = new Set()
  for (const w of words) {
    const n = w.toLowerCase().trim()
    if (n.length >= 2) set.add(n)
  }
  return set
}

// ----- Seed levels (start/end word pairs; both must exist in word_data.json) -----
// Default: English 4-letter pairs. word_data.json is French — add French pairs to get levels, e.g.:
//   { beginWord: "pain", endWord: "main" }, { beginWord: "jour", endWord: "four" }, ...
const SEED_PAIRS = [
  { id: 1, beginWord: "cold", endWord: "warm" },
  { id: 2, beginWord: "love", endWord: "hate" },
  { id: 3, beginWord: "four", endWord: "five" },
  { id: 4, beginWord: "head", endWord: "tail" },
  { id: 5, beginWord: "soft", endWord: "hard" },
  { id: 6, beginWord: "mind", endWord: "body" },
  { id: 7, beginWord: "lass", endWord: "male" },
  { id: 8, beginWord: "milk", endWord: "wine" },
  { id: 9, beginWord: "west", endWord: "east" },
  { id: 10, beginWord: "slow", endWord: "fast" },
  { id: 11, beginWord: "rise", endWord: "fall" },
  { id: 12, beginWord: "dark", endWord: "lamp" },
  { id: 13, beginWord: "cake", endWord: "pine" },
  { id: 14, beginWord: "hire", endWord: "fast" },
  { id: 15, beginWord: "game", endWord: "play" },
]

function loadWords(filename) {
  const raw = readFileSync(join(DATA_DIR, filename), "utf-8")
  return JSON.parse(raw)
}

/** Load word list from word_data.json (array of { word, definition }) */
function loadWordsFromWordData(opts = {}) {
  const { minLen = 2, maxLen = 12 } = opts
  const data = loadWords("word_data.json")
  return data
    .map((entry) => (entry.word || "").trim().toLowerCase())
    .filter((w) => w.length >= minLen && w.length <= maxLen)
}

function generateLevels(wordSet) {
  const levels = []

  for (const { id, beginWord, endWord } of SEED_PAIRS) {
    const ladder = findLadder(beginWord, endWord, wordSet)
    if (ladder === null) {
      console.warn(`No ladder for ${beginWord} → ${endWord}`)
      continue
    }
    levels.push({ id, beginWord, endWord, wordLadder: ladder })
  }

  return levels
}

function main() {
  const words = loadWordsFromWordData()
  const wordSet = toWordSet(words)
  console.log("Loaded", wordSet.size, "words from word_data.json")

  const levels = generateLevels(wordSet)

  writeFileSync(
    join(DATA_DIR, "levels.json"),
    JSON.stringify({ levels }, null, 2),
    "utf-8"
  )

  console.log("Generated levels.json:", levels.length, "levels")
}

main()
