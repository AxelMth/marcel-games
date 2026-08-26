/**
 * The one answer to "are these two spellings the same word?".
 *
 * It lives here because the two halves of the definitions pipeline disagreed
 * about it, and the disagreement shipped. fetch-definitions.mjs indexes on the
 * stripped form, so the rung "cles" can find Wiktionary's entry for "clés";
 * build-definitions.mjs then masked with a literal \b regex, which does not
 * strip anything — so "pièce" inside the definition of "piece" was not the
 * word being defined, and the answer was printed to the player five times in
 * the hint they had just paid for.
 */
export function wordKey(word) {
  return word.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
}

/**
 * Every whole-word occurrence of `word`, replaced by `mask`.
 *
 * Tokenising on \p{L}+ and comparing keys is what makes this both
 * accent-blind and accent-safe, where a \b regex was neither. JavaScript's \b
 * is ASCII-only: with no Unicode letter class behind it, it finds a word
 * boundary between "é" and "s", so masking "sent" turned "présent" into
 * "pré•••". Comparing whole tokens cannot do that — "présent" keys to
 * "present", which is not "sent".
 *
 * Incidental substrings are still left alone, deliberately: "cocaïne" keys to
 * "cocaine", not "coca", so it survives. It does not spell out the answer to a
 * player mid-guess.
 */
export function maskWord(text, word, mask) {
  const target = wordKey(word)
  return text.replace(/\p{L}+/gu, (token) =>
    wordKey(token) === target ? mask : token
  )
}
