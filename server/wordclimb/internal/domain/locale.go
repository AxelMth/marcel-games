package domain

import "strings"

// The languages declared by the Locale enum in schema.prisma. Sending anything
// else to the database fails the enum constraint at query time.
const (
	LocaleEN = "EN"
	LocaleFR = "FR"
)

// DefaultLocale is what a request that says nothing gets. English, because the
// app's own default when no locale has been saved is "en"
// (apps/wordclimb/lib/game-store.ts, getSavedLocale).
const DefaultLocale = LocaleEN

// NormalizeLocale maps a client-supplied language onto the enum above.
//
// The client stores lowercase "en" / "fr" (localStorage "wordclimb-locale") and
// may send a full BCP-47 tag such as "fr-FR", so match on the leading subtag
// rather than the whole string. Anything unrecognised falls back to English: a
// player getting the wrong language is a bad puzzle, a rejected enum is a 500.
func NormalizeLocale(locale string) string {
	normalized := strings.ToUpper(strings.TrimSpace(locale))
	if i := strings.IndexAny(normalized, "-_"); i > 0 {
		normalized = normalized[:i]
	}

	switch normalized {
	case LocaleFR:
		return LocaleFR
	case LocaleEN:
		return LocaleEN
	default:
		return DefaultLocale
	}
}
