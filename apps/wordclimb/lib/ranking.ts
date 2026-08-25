/**
 * The server returns 0 when it has no ranking for an entry — a player who has
 * never finished a daily, most obviously. Rendering that verbatim shows "#0",
 * which reads as a genuine last place rather than "not ranked yet".
 *
 * Same guard as apps/earthunt/lib/ranking.ts, which grew it for the same
 * reason.
 */
export function hasRank(rank: number): boolean {
  return rank > 0
}
