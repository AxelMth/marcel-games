/**
 * Stars for a finished level, mirroring the server.
 *
 * The authority is `ComputeStars` in server/wordclimb/internal/domain/stars.go,
 * which is what the history and the rankings are scored with. This copy exists
 * so the success screen can show a verdict the instant a level ends, without
 * waiting on `POST /level` — and it has to agree, or the modal and the history
 * would disagree about the same game.
 *
 * Accuracy is rounded rather than truncated, which is not cosmetic: integer
 * division scored 16/23 (69.56 %) as 69 and handed out one star where this
 * gives two. Earthunt's lib/stars.ts carries the same rule against its own
 * unit — countries found rather than words.
 */
export function getStars(
  attempts: number,
  wordCount: number,
  hintsUsed: number
): number {
  if (attempts <= 0) return 3
  const accuracy = Math.round((wordCount * 100) / attempts)
  if (accuracy >= 90 && hintsUsed === 0) return 3
  if (accuracy >= 70 && hintsUsed <= 2) return 2
  return 1
}
