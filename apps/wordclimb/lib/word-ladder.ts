/**
 * Word ladder algorithm: find shortest path from start to end
 * where each step changes exactly one letter. Uses BFS.
 */

/**
 * Get all words that differ by exactly one letter from `word`.
 * Only returns words that are in `wordSet`. Same length as `word` only.
 */
export function getNeighbors(
  word: string,
  wordSet: Set<string>,
  lengthFilter?: number
): string[] {
  const len = lengthFilter ?? word.length
  if (word.length !== len) return []
  const normalized = word.toLowerCase()
  const neighbors: string[] = []
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

/**
 * Find shortest word ladder from start to end using BFS.
 * Returns the list of intermediate words (excluding start and end), or null if no ladder exists.
 * All words must be in wordSet and of the same length.
 */
export function findLadder(
  start: string,
  end: string,
  wordSet: Set<string>
): string[] | null {
  const s = start.toLowerCase()
  const e = end.toLowerCase()
  if (s.length !== e.length) return null
  if (s === e) return []
  if (!wordSet.has(s) || !wordSet.has(e)) return null

  const len = s.length
  const filteredSet = new Set<string>(
    [...wordSet].filter((w) => w.length === len && w.toLowerCase() === w)
  )
  if (!filteredSet.has(s) || !filteredSet.has(e)) return null

  const queue: { word: string; path: string[] }[] = [{ word: s, path: [] }]
  const visited = new Set<string>([s])

  while (queue.length > 0) {
    const { word, path } = queue.shift()!
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

/**
 * Build a set of words of a given length from a word list (lowercased).
 */
export function wordSetForLength(words: string[], length: number): Set<string> {
  const set = new Set<string>()
  for (const w of words) {
    const n = w.toLowerCase().trim()
    if (n.length === length) set.add(n)
  }
  return set
}

/**
 * Full word set (all lengths) for discovery; each ladder still uses same-length only.
 */
export function toWordSet(words: string[]): Set<string> {
  const set = new Set<string>()
  for (const w of words) {
    const n = w.toLowerCase().trim()
    if (n.length >= 2) set.add(n)
  }
  return set
}
