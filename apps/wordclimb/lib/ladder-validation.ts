import type { Level } from "./data/catalogue"

export interface LadderProblem {
  levelId: number
  reason: string
}

/** Number of positions at which two equal-length words differ, or null if the lengths differ. */
export function hammingDistance(a: string, b: string): number | null {
  if (a.length !== b.length) return null
  let distance = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) distance++
  }
  return distance
}

/** The full chain the player walks: begin word, every rung, end word. */
export function fullChain(level: Level): string[] {
  return [level.beginWord, ...level.wordLadder, level.endWord]
}

/**
 * Checks a level against the one rule the whole game rests on: every step
 * changes exactly one letter, and no word repeats.
 *
 * This is not pedantry. A step of two letters cannot be reached by the move the
 * game teaches, and a word of a different length renders a row with the wrong
 * number of letter boxes. Levels that break it are unplayable as puzzles.
 */
export function validateLevel(level: Level): LadderProblem[] {
  const problems: LadderProblem[] = []
  const chain = fullChain(level)

  for (let i = 0; i < chain.length - 1; i++) {
    const from = chain[i]
    const to = chain[i + 1]
    const distance = hammingDistance(from, to)

    if (distance === null) {
      problems.push({
        levelId: level.id,
        reason: `"${from}" (${from.length} letters) and "${to}" (${to.length}) are not the same length`,
      })
    } else if (distance !== 1) {
      problems.push({
        levelId: level.id,
        reason: `"${from}" to "${to}" changes ${distance} letters, not one`,
      })
    }
  }

  if (new Set(chain).size !== chain.length) {
    problems.push({ levelId: level.id, reason: `repeats a word: ${chain.join(" → ")}` })
  }

  // Begin and end are both shown from the start, so a rungless level asks the
  // player for nothing and completes itself.
  if (level.wordLadder.length === 0) {
    problems.push({ levelId: level.id, reason: "has no word for the player to find" })
  }

  return problems
}

export function isValidLevel(level: Level): boolean {
  return validateLevel(level).length === 0
}

export function validateCatalogue(levels: Level[]): LadderProblem[] {
  return levels.flatMap(validateLevel)
}
