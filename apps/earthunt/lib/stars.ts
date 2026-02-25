/**
 * Compute stars from attempts, countryCount, hintsUsed.
 * Matches backend: accuracy = (countryCount/attempts)*100
 * 3 stars: accuracy >= 90 && hintsUsed === 0
 * 2 stars: accuracy >= 70 && hintsUsed <= 2
 * 1 star: else
 */
export function getStars(
  attempts: number,
  countryCount: number,
  hintsUsed: number
): number {
  if (attempts <= 0) return 3
  const accuracy = Math.round((countryCount / attempts) * 100)
  if (accuracy >= 90 && hintsUsed === 0) return 3
  if (accuracy >= 70 && hintsUsed <= 2) return 2
  return 1
}
