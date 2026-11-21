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
  // No guesses is perfect ACCURACY, not a perfect run: a level finished
  // entirely on hints used to short-circuit to 3 here, before hintsUsed was
  // ever read. Feeding 100 into the ordinary rule lets the hint clause bite.
  const accuracy = attempts <= 0 ? 100 : Math.round((countryCount / attempts) * 100)
  if (accuracy >= 90 && hintsUsed === 0) return 3
  if (accuracy >= 70 && hintsUsed <= 2) return 2
  return 1
}
