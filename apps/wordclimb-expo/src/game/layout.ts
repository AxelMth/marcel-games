import { LIP } from "@/theme/tokens"

export const TILE_GAP = 8
export const MAX_TILE = 56
const MIN_TILE = 34
/** Left rail and margin, plus the right rail and the mascot hanging off it. */
export const LADDER_PAD_LEFT = 34
export const LADDER_PAD_RIGHT = 64
/** The "goal" and "start" captions above and below the ladder. */
const CAPTIONS_HEIGHT = 64

export interface LadderLayout {
  tile: number
  rowGap: number
  /** Distance from the top of one row to the top of the next. */
  rowPitch: number
}

/**
 * Sizes the tiles so a whole ladder fits the space it is given: wide enough
 * for a six-letter word, short enough for seven rows. Below the minimum the
 * tiles stop shrinking and the ladder scrolls instead.
 */
export function ladderLayout(input: {
  width: number
  height: number
  letters: number
  rows: number
}): LadderLayout {
  const { width, height, letters, rows } = input
  const rowGap = rows > 6 ? 10 : 16
  const usableWidth = width - LADDER_PAD_LEFT - LADDER_PAD_RIGHT
  const byWidth = Math.floor((usableWidth - (letters - 1) * TILE_GAP) / letters)
  const byHeight =
    Math.floor((height - CAPTIONS_HEIGHT - (rows - 1) * rowGap) / rows) - LIP
  const tile = Math.max(MIN_TILE, Math.min(MAX_TILE, byWidth, byHeight))
  return { tile, rowGap, rowPitch: tile + LIP + rowGap }
}
