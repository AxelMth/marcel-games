package handlers

import (
	"encoding/json"
	"testing"
)

// The client reads these keys by name, so the JSON shape is the contract.
// LevelPayload is embedded in GetLevelInfoResponse; this asserts its fields are
// promoted to the top level instead of nested under a struct key.
func Test_GetLevelInfoResponseWireFormat(t *testing.T) {
	response := GetLevelInfoResponse{
		Level: 3,
		LevelPayload: LevelPayload{
			BeginWord:  "cold",
			EndWord:    "warm",
			WordLadder: []string{"cold", "cord", "card", "ward", "warm"},
		},
	}

	encoded, err := json.Marshal(response)
	if err != nil {
		t.Fatal(err)
	}

	var decoded map[string]any
	if err := json.Unmarshal(encoded, &decoded); err != nil {
		t.Fatal(err)
	}

	for _, key := range []string{"level", "beginWord", "endWord", "wordLadder"} {
		if _, ok := decoded[key]; !ok {
			t.Errorf("Expected key %q at the top level, but got %s", key, encoded)
		}
	}

	if _, ok := decoded["stats"]; ok {
		t.Errorf("Expected stats to be omitted when nil, but got %s", encoded)
	}
}

func Test_EmptyLevelPayloadKeepsWordLadderAsEmptyArray(t *testing.T) {
	encoded, err := json.Marshal(emptyLevelPayload())
	if err != nil {
		t.Fatal(err)
	}

	var decoded map[string]any
	if err := json.Unmarshal(encoded, &decoded); err != nil {
		t.Fatal(err)
	}

	ladder, ok := decoded["wordLadder"].([]any)
	if !ok {
		t.Fatalf("Expected wordLadder to be a JSON array, but got %s", encoded)
	}
	if len(ladder) != 0 {
		t.Errorf("Expected an empty wordLadder, but got %s", encoded)
	}
}
