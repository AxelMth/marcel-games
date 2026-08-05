package utils

import "fmt"

// ValidateLadder checks the one rule the game is built on: from the begin word
// to the end word, every step changes exactly one letter, and no word repeats.
//
// It is the Go counterpart of problemsFor() in
// apps/wordclimb/scripts/build-catalogue.mjs. The generator already rejects bad
// ladders, so a failure here means the catalogue on disk no longer matches the
// generator that produced it — a reason to fail the populate job rather than
// write an unplayable puzzle to the database.
//
// Comparison is by rune, not byte: the French catalogue is accented and "pâte"
// is four letters, not five.
func ValidateLadder(beginWord, endWord string, wordLadder []string) error {
	if beginWord == "" || endWord == "" {
		return fmt.Errorf("begin and end words are required")
	}
	if len(wordLadder) == 0 {
		return fmt.Errorf("no rung to find between %q and %q", beginWord, endWord)
	}

	chain := make([]string, 0, len(wordLadder)+2)
	chain = append(chain, beginWord)
	chain = append(chain, wordLadder...)
	chain = append(chain, endWord)

	seen := make(map[string]struct{}, len(chain))
	for i, word := range chain {
		if _, repeated := seen[word]; repeated {
			return fmt.Errorf("%q appears twice", word)
		}
		seen[word] = struct{}{}

		if i == 0 {
			continue
		}

		distance, err := letterDistance(chain[i-1], word)
		if err != nil {
			return err
		}
		if distance != 1 {
			return fmt.Errorf("%q → %q changes %d letters", chain[i-1], word, distance)
		}
	}

	return nil
}

// letterDistance counts the positions where two equal-length words differ.
func letterDistance(a, b string) (int, error) {
	left, right := []rune(a), []rune(b)
	if len(left) != len(right) {
		return 0, fmt.Errorf("%q and %q differ in length", a, b)
	}

	distance := 0
	for i := range left {
		if left[i] != right[i] {
			distance++
		}
	}
	return distance, nil
}
