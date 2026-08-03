import type { GameHistoryEntry } from "./api"

/**
 * The server returns 0 when it has no ranking for an entry — for instance a
 * mode the player has never touched. Rendering that verbatim shows "#0", which
 * reads as a genuine last place.
 */
export function hasRank(rank: number): boolean {
  return rank > 0
}

/**
 * Best rank the player achieved in one game mode.
 *
 * ProfileStats carries no per-mode rank: `globalRank` is computed from
 * LEVEL_OF_THE_DAY history alone (see GetUserGlobalDailyRank in the Go server),
 * so showing it under the World or Continent tab displays another leaderboard
 * entirely. GameHistoryEntry.rank, on the other hand, is already mode-aware —
 * getRankForLevelEntry filters on the entry's own gameMode — so the per-mode
 * figure can be derived from the history the API already sends.
 *
 * Returns null when the mode has no ranked entry, so the caller can show an
 * explicit "not ranked yet" rather than a number.
 */
export function bestRankForMode(
  history: GameHistoryEntry[],
  mode: string
): number | null {
  const ranks = history
    .filter((entry) => entry.gameMode === mode)
    .map((entry) => entry.rank)
    .filter(hasRank)

  return ranks.length > 0 ? Math.min(...ranks) : null
}
