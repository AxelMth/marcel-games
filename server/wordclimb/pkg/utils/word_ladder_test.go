package utils

import "testing"

func TestFindLadder_FindsPathBetweenWords(t *testing.T) {
	// Dictionary chosen so that a clear ladder exists: cold -> cord -> card -> ward -> warm
	words := []string{"cold", "cord", "card", "ward", "warm"}
	wordSet := ToWordSet(words)

	ladder := FindLadder("cold", "warm", wordSet)
	if ladder == nil {
		t.Fatalf("expected a ladder, got nil")
	}

	// Expect at least start and end.
	if len(ladder) < 2 {
		t.Fatalf("expected ladder length >= 2 (start and end), got %d", len(ladder))
	}

	if ladder[0] != "cold" {
		t.Errorf("expected first word to be 'cold', got %q", ladder[0])
	}

	last := ladder[len(ladder)-1]
	if last != "warm" {
		t.Errorf("expected last word to be 'warm', got %q", last)
	}

	// Ensure each consecutive pair differs by exactly one character.
	for i := 0; i < len(ladder)-1; i++ {
		if diff := hammingDistance(ladder[i], ladder[i+1]); diff != 1 {
			t.Errorf("expected words %q and %q to differ by 1 character, got %d", ladder[i], ladder[i+1], diff)
		}
	}
}

func TestFindLadder_NoPathReturnsNil(t *testing.T) {
	words := []string{"cold", "cord", "card", "ward", "warm"}
	wordSet := ToWordSet(words)

	ladder := FindLadder("cold", "pink", wordSet)
	if ladder != nil {
		t.Fatalf("expected nil ladder when no path exists, got %v", ladder)
	}
}

func TestFindLadder_StartEqualsEnd(t *testing.T) {
	words := []string{"cold"}
	wordSet := ToWordSet(words)

	ladder := FindLadder("cold", "cold", wordSet)
	if ladder == nil {
		t.Fatalf("expected non-nil ladder for identical start/end, got nil")
	}
	if len(ladder) != 1 || ladder[0] != "cold" {
		t.Fatalf("expected ladder [\"cold\"], got %v", ladder)
	}
}

func TestGenerateLevels_SkipsUnreachablePairs(t *testing.T) {
	words := []string{"cold", "cord", "card", "ward", "warm"}
	wordSet := ToWordSet(words)

	seeds := []SeedPair{
		{ID: 1, BeginWord: "cold", EndWord: "warm"}, // reachable
		{ID: 2, BeginWord: "blue", EndWord: "pink"}, // not in dictionary
	}

	levels := GenerateLevels(seeds, wordSet)

	if len(levels) != 1 {
		t.Fatalf("expected 1 generated level, got %d", len(levels))
	}

	level := levels[0]
	if level.ID != 1 {
		t.Errorf("expected level ID 1, got %d", level.ID)
	}
	if level.BeginWord != "cold" || level.EndWord != "warm" {
		t.Errorf("unexpected begin/end words: got %q -> %q", level.BeginWord, level.EndWord)
	}
	if len(level.WordLadder) < 2 {
		t.Errorf("expected word ladder length >= 2, got %d", len(level.WordLadder))
	}
}

// hammingDistance returns the number of differing characters between two
// equal-length strings. If lengths differ, it returns -1.
func hammingDistance(a, b string) int {
	if len(a) != len(b) {
		return -1
	}
	diff := 0
	for i := 0; i < len(a); i++ {
		if a[i] != b[i] {
			diff++
		}
	}
	return diff
}

