package utils

import "testing"

func Test_ValidateLadderAcceptsAOneLetterChain(t *testing.T) {
	if err := ValidateLadder("cold", "warm", []string{"cord", "card", "ward"}); err != nil {
		t.Errorf("Expected a valid ladder, but got: %v", err)
	}
}

func Test_ValidateLadderRejectsATwoLetterJump(t *testing.T) {
	err := ValidateLadder("cold", "warm", []string{"cord", "ward"})
	if err == nil {
		t.Fatal("Expected a two-letter jump to be rejected")
	}
}

func Test_ValidateLadderRejectsARepeatedWord(t *testing.T) {
	if err := ValidateLadder("cold", "cord", []string{"cord"}); err == nil {
		t.Fatal("Expected a repeated word to be rejected")
	}
}

func Test_ValidateLadderRejectsALadderWithNoRung(t *testing.T) {
	if err := ValidateLadder("cold", "cord", nil); err == nil {
		t.Fatal("Expected a ladder with no rung to be rejected")
	}
}

func Test_ValidateLadderRejectsMismatchedLengths(t *testing.T) {
	if err := ValidateLadder("cold", "cords", []string{"cord"}); err == nil {
		t.Fatal("Expected words of different lengths to be rejected")
	}
}

// The French catalogue is accented. Compared as bytes, "pâte" is five long and
// "pâle" → "pâte" would read as a two-byte difference; compared as runes it is
// the single-letter change it looks like.
func Test_ValidateLadderCountsAccentedLettersAsOne(t *testing.T) {
	if err := ValidateLadder("pâle", "pâtu", []string{"pâte"}); err != nil {
		t.Errorf("Expected accented words to compare by rune, but got: %v", err)
	}
}

func Test_ValidateLadderRejectsAnAccentedTwoLetterJump(t *testing.T) {
	if err := ValidateLadder("pâle", "côte", []string{"pâte"}); err == nil {
		t.Fatal("Expected a two-letter jump between accented words to be rejected")
	}
}
