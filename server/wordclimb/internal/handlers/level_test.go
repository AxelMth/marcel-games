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
			BeginWord: "cold",
			EndWord:   "warm",
			// Intermediate words only — the begin and end words are not repeated.
			WordLadder: []string{"cord", "card", "ward"},
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

// The daily branch of both handlers answers with an empty payload once the
// player is done for the day. Built from the zero value instead of
// emptyLevelPayload(), it used to put a null on the wire where the client
// expects an array it can iterate.
func Test_FinishLevelResponseKeepsNextWordLadderAsEmptyArray(t *testing.T) {
	payload := emptyLevelPayload()
	response := FinishLevelResponse{
		NextLevel:      1,
		NextBeginWord:  payload.BeginWord,
		NextEndWord:    payload.EndWord,
		NextWordLadder: payload.WordLadder,
	}

	encoded, err := json.Marshal(response)
	if err != nil {
		t.Fatal(err)
	}

	var decoded map[string]any
	if err := json.Unmarshal(encoded, &decoded); err != nil {
		t.Fatal(err)
	}

	ladder, ok := decoded["nextWordLadder"].([]any)
	if !ok {
		t.Fatalf("Expected nextWordLadder to be a JSON array, but got %s", encoded)
	}
	if len(ladder) != 0 {
		t.Errorf("Expected an empty nextWordLadder, but got %s", encoded)
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
