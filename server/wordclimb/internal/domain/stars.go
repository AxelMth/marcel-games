package domain

// ComputeStars returns 1-3 stars from attempts, wordCount, hintsUsed.
// wordCount is the length of the level's word ladder, so accuracy measures how
// close the player got to solving it in the minimum number of guesses:
// accuracy = (wordCount/attempts)*100
// 3 stars: accuracy >= 90 && hintsUsed == 0
// 2 stars: accuracy >= 70 && hintsUsed <= 2
// 1 star: else
func ComputeStars(attempts, wordCount, hintsUsed int) int {
	if attempts <= 0 {
		return 3
	}
	accuracy := (wordCount * 100) / attempts
	if accuracy >= 90 && hintsUsed == 0 {
		return 3
	}
	if accuracy >= 70 && hintsUsed <= 2 {
		return 2
	}
	return 1
}
