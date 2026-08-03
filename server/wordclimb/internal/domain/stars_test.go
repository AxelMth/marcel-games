package domain

import "testing"

// Same table as STAR_PARITY_CASES in apps/earthunt/lib/stars.test.ts: the
// scoring rule is shared across both games, and these rows pin the rounding
// behavior. Wordclimb's client does not compute stars today — the stats screen
// renders what the server stored — but if it ever does, it must agree on every
// row here.
func TestComputeStars_MatchesClient(t *testing.T) {
	cases := []struct {
		name      string
		attempts  int
		wordCount int
		hintsUsed int
		want      int
	}{
		{"no attempts", 0, 0, 0, 3},
		{"negative attempts", -1, 5, 9, 3},
		{"perfect", 10, 10, 0, 3},
		{"90 percent no hints", 10, 9, 0, 3},
		{"90 percent one hint", 10, 9, 1, 2},
		{"70 percent no hints", 10, 7, 0, 2},
		{"70 percent two hints", 10, 7, 2, 2},
		{"70 percent three hints", 10, 7, 3, 1},
		{"60 percent", 10, 6, 0, 1},
		{"25 percent", 20, 5, 0, 1},
		// 69.56 % — truncation scored this 69 (1 star) while the client rounded
		// to 70 (2 stars). This is the case that exposed the split.
		{"rounds up across the 70 boundary", 23, 16, 0, 2},
		// 89.47 % must not round up to 90.
		{"does not round up across the 90 boundary", 19, 17, 0, 2},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := ComputeStars(tc.attempts, tc.wordCount, tc.hintsUsed)
			if got != tc.want {
				t.Errorf(
					"ComputeStars(attempts=%d, wordCount=%d, hintsUsed=%d) = %d, want %d",
					tc.attempts, tc.wordCount, tc.hintsUsed, got, tc.want,
				)
			}
		})
	}
}

func TestComputeStars_AlwaysInRange(t *testing.T) {
	for attempts := 0; attempts <= 40; attempts++ {
		for found := 0; found <= 20; found++ {
			for _, hints := range []int{0, 1, 2, 3, 10} {
				got := ComputeStars(attempts, found, hints)
				if got < 1 || got > 3 {
					t.Fatalf(
						"ComputeStars(%d, %d, %d) = %d, out of the 1..3 range",
						attempts, found, hints, got,
					)
				}
			}
		}
	}
}
