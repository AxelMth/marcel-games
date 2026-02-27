package utils

import "strings"

// SeedPair represents a requested level: begin/end words plus an ID.
type SeedPair struct {
	ID        int
	BeginWord string
	EndWord   string
}

// LevelDefinition is a generated, playable level.
type LevelDefinition struct {
	ID         int
	BeginWord  string
	EndWord    string
	WordLadder []string
}

// ToWordSet normalizes a list of words (trimmed, lowercased) into a set,
// discarding entries shorter than 2 characters.
func ToWordSet(words []string) map[string]struct{} {
	set := make(map[string]struct{}, len(words))
	for _, w := range words {
		n := strings.ToLower(strings.TrimSpace(w))
		if len(n) >= 2 {
			set[n] = struct{}{}
		}
	}
	return set
}

// FindLadder performs a BFS to find a word ladder between start and end.
//
// Behavior is inspired by apps/wordclimb/scripts/generate-word-ladders.mjs:
// - Words are normalized to lowercase.
// - Only words of the same length are considered.
// - Only substitutions (one-letter changes) are allowed.
// - All words must already exist in wordSet.
//
// It returns the full path including both start and end words.
// If no ladder exists, it returns nil. If start == end, it returns []string{start}.
func FindLadder(start, end string, wordSet map[string]struct{}) []string {
	s := strings.ToLower(strings.TrimSpace(start))
	e := strings.ToLower(strings.TrimSpace(end))

	if s == "" || e == "" {
		return nil
	}

	if len(s) != len(e) {
		return nil
	}

	if s == e {
		return []string{s}
	}

	if _, ok := wordSet[s]; !ok {
		return nil
	}
	if _, ok := wordSet[e]; !ok {
		return nil
	}

	// Filter to same-length, lowercase words for this search, mirroring the script.
	filtered := make(map[string]struct{})
	for w := range wordSet {
		n := strings.ToLower(w)
		if len(n) == len(s) && n == w {
			filtered[w] = struct{}{}
		}
	}

	if _, ok := filtered[s]; !ok {
		return nil
	}
	if _, ok := filtered[e]; !ok {
		return nil
	}

	type queueItem struct {
		word string
		path []string
	}

	queue := []queueItem{{word: s, path: []string{s}}}
	visited := map[string]struct{}{s: {}}

	for len(queue) > 0 {
		item := queue[0]
		queue = queue[1:]

		for _, next := range getNeighbors(item.word, filtered) {
			if _, seen := visited[next]; seen {
				continue
			}
			visited[next] = struct{}{}

			newPath := append(append([]string(nil), item.path...), next)
			if next == e {
				return newPath
			}

			queue = append(queue, queueItem{
				word: next,
				path: newPath,
			})
		}
	}

	return nil
}

// GenerateLevels builds level definitions for the given seed pairs using the
// provided dictionary. Pairs for which no ladder exists are skipped.
func GenerateLevels(seeds []SeedPair, wordSet map[string]struct{}) []LevelDefinition {
	result := make([]LevelDefinition, 0, len(seeds))
	for _, seed := range seeds {
		ladder := FindLadder(seed.BeginWord, seed.EndWord, wordSet)
		if ladder == nil || len(ladder) == 0 {
			continue
		}

		result = append(result, LevelDefinition{
			ID:         seed.ID,
			BeginWord:  seed.BeginWord,
			EndWord:    seed.EndWord,
			WordLadder: ladder,
		})
	}
	return result
}

// getNeighbors returns words from wordSet that are one substitution away
// (same length, differing by exactly one character) from the given word.
func getNeighbors(word string, wordSet map[string]struct{}) []string {
	normalized := strings.ToLower(word)
	if len(normalized) == 0 {
		return nil
	}

	const alphabet = "abcdefghijklmnopqrstuvwxyz"

	neighbors := make([]string, 0)
	// Use bytes since we only generate ASCII 'a'-'z'.
	for i := 0; i < len(normalized); i++ {
		for j := 0; j < len(alphabet); j++ {
			c := alphabet[j]
			if c == normalized[i] {
				continue
			}

			candidateBytes := []byte(normalized)
			candidateBytes[i] = c
			candidate := string(candidateBytes)

			if _, ok := wordSet[candidate]; ok {
				neighbors = append(neighbors, candidate)
			}
		}
	}

	return neighbors
}

