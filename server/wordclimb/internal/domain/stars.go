package domain

import "math"

// ComputeStars returns 1-3 stars from attempts, wordCount, hintsUsed.
// wordCount is the length of the level's word ladder, so accuracy measures how
// close the player got to solving it in the minimum number of guesses.
//
// The rule (rounding included) is the one shared with earthunt's client;
// today only the server computes stars for wordclimb, but if the client ever
// renders its own score it must agree on every case in stars_test.go.
//
// accuracy = round((wordCount/attempts)*100)
// 3 stars: accuracy >= 90 && hintsUsed == 0
// 2 stars: accuracy >= 70 && hintsUsed <= 2
// 1 star: else
func ComputeStars(attempts, wordCount, hintsUsed int) int {
	if attempts <= 0 {
		return 3
	}
	// Rounded, not truncated: integer division scored 16/23 (69.56 %) as 69,
	// giving 1 star where the client formula gives 2.
	accuracy := int(math.Round(float64(wordCount) * 100 / float64(attempts)))
	if accuracy >= 90 && hintsUsed == 0 {
		return 3
	}
	if accuracy >= 70 && hintsUsed <= 2 {
		return 2
	}
	return 1
}
