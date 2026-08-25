package domain

import "math"

// ComputeStars returns 1-3 stars from attempts, countryCount, hintsUsed.
// Must stay identical to the client's getStars in apps/earthunt/lib/stars.ts —
// the success screen renders the client value while the stats screen renders
// what we stored here, so any divergence shows the player two different scores
// for the same game. The shared table of cases lives in stars_test.go and
// stars.test.ts; add rows to both.
//
// accuracy = round((countryCount/attempts)*100)
// 3 stars: accuracy >= 90 && hintsUsed == 0
// 2 stars: accuracy >= 70 && hintsUsed <= 2
// 1 star: else
func ComputeStars(attempts, countryCount, hintsUsed int) int {
	// No guesses is perfect ACCURACY, not a perfect run: a level finished
	// entirely on hints used to short-circuit to 3 stars here, before the hint
	// count was ever read. Feeding 100 into the ordinary rule lets the hint
	// clause do its job.
	accuracy := 100
	if attempts > 0 {
		// Rounded, not truncated: integer division scored 16/23 (69.56 %) as
		// 69, giving 1 star where the client showed 2.
		accuracy = int(math.Round(float64(countryCount) * 100 / float64(attempts)))
	}
	if accuracy >= 90 && hintsUsed == 0 {
		return 3
	}
	if accuracy >= 70 && hintsUsed <= 2 {
		return 2
	}
	return 1
}
