/**
 * Exhaustive word-ladder enumeration.
 *
 * The naive approach — run a BFS for every candidate pair — costs O(n²) traversals
 * and is why earlier generators had to stop at a few hundred puzzles. One BFS from
 * a word already yields its shortest distance to *every* reachable word, so a
 * single pass per word enumerates every pair exactly once: O(n) traversals, and
 * the complete set rather than a sample.
 *
 * Neighbours are substitutions only. Allowing insertions and deletions is what
 * produced ladders that changed word length mid-climb, which the game cannot
 * render — a row has one box per letter.
 */

const ALPHABET = "abcdefghijklmnopqrstuvwxyz"

/**
 * Adjacency by index. Built once per word length: comparing only same-length
 * words keeps the graph small and makes the length invariant structural rather
 * than something to check later.
 */
export function buildGraph(words) {
  const index = new Map(words.map((w, i) => [w, i]))
  const adjacency = words.map(() => [])

  words.forEach((word, i) => {
    for (let position = 0; position < word.length; position++) {
      for (const letter of ALPHABET) {
        if (letter === word[position]) continue
        const candidate =
          word.slice(0, position) + letter + word.slice(position + 1)
        const j = index.get(candidate)
        if (j !== undefined && j > i) {
          adjacency[i].push(j)
          adjacency[j].push(i)
        }
      }
    }
  })

  return { words, adjacency }
}

/**
 * Every pair reachable from `start` in `minRungs`..`maxRungs` intermediate
 * words, with the actual path. Distance is in edges; a path of d edges has
 * d - 1 intermediate words.
 */
export function laddersFrom({ words, adjacency }, start, minRungs, maxRungs) {
  const maxDepth = maxRungs + 1
  const previous = new Int32Array(words.length).fill(-1)
  const depth = new Int32Array(words.length).fill(-1)

  depth[start] = 0
  let frontier = [start]
  const found = []

  for (let d = 1; d <= maxDepth && frontier.length > 0; d++) {
    const next = []
    for (const current of frontier) {
      for (const neighbour of adjacency[current]) {
        if (depth[neighbour] !== -1) continue
        depth[neighbour] = d
        previous[neighbour] = current
        next.push(neighbour)

        const rungs = d - 1
        // Only emit each pair once: the higher index owns it.
        if (rungs >= minRungs && rungs <= maxRungs && neighbour > start) {
          const path = []
          for (let node = previous[neighbour]; node !== start; node = previous[node]) {
            path.push(words[node])
          }
          path.reverse()
          found.push({
            beginWord: words[start],
            endWord: words[neighbour],
            wordLadder: path,
          })
        }
      }
    }
    frontier = next
  }

  return found
}

/** Every ladder in the graph, for every start word. */
export function allLadders(graph, minRungs, maxRungs) {
  const out = []
  for (let i = 0; i < graph.words.length; i++) {
    out.push(...laddersFrom(graph, i, minRungs, maxRungs))
  }
  return out
}

/**
 * Picks a spread rather than the first N found.
 *
 * Taking whatever the enumeration yields first would hand the player a run of
 * puzzles that all start with "a" and all have two rungs. Cycling difficulty
 * tiers and rationing how often a word may reappear keeps the catalogue varied
 * without discarding most of it.
 */
export function selectSpread(ladders, { limit, maxUsesPerWord }) {
  // Derived from the corpus when not given. English has only ~500 four-letter
  // words, so a low cap would starve the catalogue; French has thousands and
  // barely notices. Roughly: how many slots each word must fill on average,
  // with headroom.
  if (maxUsesPerWord === undefined) {
    const vocabulary = new Set()
    for (const l of ladders) {
      vocabulary.add(l.beginWord)
      vocabulary.add(l.endWord)
      for (const w of l.wordLadder) vocabulary.add(w)
    }
    maxUsesPerWord = Math.max(3, Math.ceil((limit * 8) / Math.max(1, vocabulary.size)))
  }
  const byRungs = new Map()
  for (const ladder of ladders) {
    const list = byRungs.get(ladder.wordLadder.length) ?? []
    list.push(ladder)
    byRungs.set(ladder.wordLadder.length, list)
  }

  // Deterministic but not alphabetical: interleave so neighbours in the source
  // order do not end up adjacent in the catalogue.
  for (const list of byRungs.values()) {
    list.sort((a, b) =>
      (a.beginWord + a.endWord).localeCompare(b.beginWord + b.endWord)
    )
  }

  const tiers = [...byRungs.keys()].sort((a, b) => a - b)
  const cursors = new Map(tiers.map((t) => [t, 0]))
  const uses = new Map()
  const chosen = []

  const canUse = (ladder) =>
    [ladder.beginWord, ladder.endWord, ...ladder.wordLadder].every(
      (w) => (uses.get(w) ?? 0) < maxUsesPerWord
    )

  let exhausted = false
  while (chosen.length < limit && !exhausted) {
    exhausted = true
    for (const tier of tiers) {
      if (chosen.length >= limit) break
      const list = byRungs.get(tier)
      let i = cursors.get(tier)
      while (i < list.length && !canUse(list[i])) i++
      cursors.set(tier, i + 1)
      if (i >= list.length) continue

      exhausted = false
      const ladder = list[i]
      for (const w of [ladder.beginWord, ladder.endWord, ...ladder.wordLadder]) {
        uses.set(w, (uses.get(w) ?? 0) + 1)
      }
      chosen.push(ladder)
    }
  }

  // Easiest first, so the progression ramps.
  chosen.sort((a, b) => a.wordLadder.length - b.wordLadder.length)
  return chosen
}
