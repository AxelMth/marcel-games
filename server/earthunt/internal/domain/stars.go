package domain

// ComputeStars returns 1-3 stars from attempts, countryCount, hintsUsed.
// Matches frontend: accuracy = (countryCount/attempts)*100
// 3 stars: accuracy >= 90 && hintsUsed == 0
// 2 stars: accuracy >= 70 && hintsUsed <= 2
// 1 star: else
func ComputeStars(attempts, countryCount, hintsUsed int) int {
	if attempts <= 0 {
		return 3
	}
	accuracy := (countryCount * 100) / attempts
	if accuracy >= 90 && hintsUsed == 0 {
		return 3
	}
	if accuracy >= 70 && hintsUsed <= 2 {
		return 2
	}
	return 1
}
