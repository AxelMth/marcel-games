package domain

import "testing"

func Test_NormalizeLocaleAcceptsTheClientSpellings(t *testing.T) {
	tests := map[string]string{
		// What localStorage "wordclimb-locale" actually holds.
		"en": LocaleEN,
		"fr": LocaleFR,
		// The enum values themselves.
		"EN": LocaleEN,
		"FR": LocaleFR,
		// Full BCP-47 tags, in case a device locale is forwarded as-is.
		"fr-FR": LocaleFR,
		"en-GB": LocaleEN,
		"fr_CA": LocaleFR,
		"  fr ": LocaleFR,
	}

	for input, expected := range tests {
		if got := NormalizeLocale(input); got != expected {
			t.Errorf("Expected %q to normalize to %s, but got %s", input, expected, got)
		}
	}
}

// A language the game does not ship must not reach the database: the Locale
// enum would reject it and turn a wrong-language puzzle into a 500.
func Test_NormalizeLocaleFallsBackToTheDefault(t *testing.T) {
	for _, input := range []string{"", "de", "es-ES", "gibberish", "-", "zz"} {
		if got := NormalizeLocale(input); got != DefaultLocale {
			t.Errorf("Expected %q to fall back to %s, but got %s", input, DefaultLocale, got)
		}
	}
}
