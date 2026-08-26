/**
 * Vendors one definition per word, per locale, from Wiktionary.
 *
 * The app shipped 40 hand-written definitions for a catalogue that needs 1415,
 * so nearly every word fell back to a generic line. The obvious source looked
 * like data-sources/fr-dictionary.json, already in the repo — but 433 of the
 * 1123 French rungs resolve there to a "Le mot exact n'a pas été trouvé,
 * choisissez la bonne orthographe" page followed by spelling suggestions. Read
 * naively, that hands the player a list of near-misses instead of a
 * definition. That file stays what it is — the word list generate-levels.mjs
 * picks from — and definitions come from here instead, the same way for both
 * locales.
 *
 * Each locale is taken from the Wiktionary edition written in that language,
 * so French words are defined in French. Dumps are read as a gzip stream and
 * filtered down to a few megabytes; the multi-gigabyte source never lands on
 * disk. Definitions are CC BY-SA — see the credits section in the legal modal.
 *
 * Run: pnpm --filter @marcel-games/wordclimb fetch:definitions en
 *      KAIKKI_JSONL=/path/to/dump.jsonl.gz pnpm … fetch:definitions fr
 */

import { createReadStream, writeFileSync } from "node:fs"
import { createInterface } from "node:readline"
import { createGunzip } from "node:zlib"
import { Readable } from "node:stream"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SOURCE_DIR = join(__dirname, "..", "data-sources")

const SOURCES = {
  // The English edition ships as one raw dump covering every language it
  // documents, hence the lang_code filter below.
  en: "https://kaikki.org/dictionary/raw-wiktextract-data.jsonl.gz",
  // Note the frwiktionary extraction, not kaikki's "French" dictionary: that
  // one is French words as described by the *English* Wiktionary, so its
  // glosses are in English.
  fr: "https://kaikki.org/dictionary/downloads/fr/fr-extract.jsonl.gz",
}

// The word lengths the game plays with, from generate-levels.mjs. Keeping the
// vendored files to that range holds each to a few megabytes rather than the
// million-plus entries a full edition carries.
const MIN_LEN = 4
const MAX_LEN = 6

/**
 * A player should not be handed a sense they have never met. This is the
 * tag-based twin of the register filter generate-levels.mjs applies to French,
 * where the same markers appear as text inside the definition. wiktextract
 * normalises tags to English across every edition.
 */
const REJECTED_TAGS = new Set([
  "obsolete",
  "archaic",
  "dated",
  "dialectal",
  "rare",
  "slang",
  "vulgar",
  "offensive",
  "derogatory",
])

/**
 * Ranks the senses of one entry, best first.
 *
 * Two things make a bad hint, and they pull in opposite directions. A "simple
 * past of make" gloss names the answer's lemma, so an ordinary sense wins over
 * an inflection pointer. But the only ordinary sense is sometimes a dead one:
 * "made" is an obsolete dialect noun for a maggot, and preferring it over the
 * inflection turns the hint into a lie. Register is checked first, inflection
 * second.
 */
function bestGloss(entry) {
  let best = null
  for (const sense of entry.senses ?? []) {
    const gloss = sense.glosses?.[0]
    if (!gloss) continue
    const stale = (sense.tags ?? []).some((tag) => REJECTED_TAGS.has(tag))
    const inflection = Boolean(sense.form_of?.length || sense.alt_of?.length)
    const rank = (stale ? 2 : 0) + (inflection ? 1 : 0)
    if (!best || rank < best.rank) best = { gloss, rank }
    if (rank === 0) break
  }
  return best
}

async function openDump(url) {
  const local = process.env.KAIKKI_JSONL
  if (local) {
    console.log(`Reading ${local}`)
    const file = createReadStream(local)
    return local.endsWith(".gz") ? file.pipe(createGunzip()) : file
  }

  console.log(`Downloading ${url} (streamed, not saved)`)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return Readable.fromWeb(response.body).pipe(createGunzip())
}

const locale = process.argv[2]
if (!SOURCES[locale]) {
  throw new Error(`Usage: node scripts/fetch-definitions.mjs <${Object.keys(SOURCES).join("|")}>`)
}

// A cheap string test that runs before JSON.parse, which is the whole cost of
// this script: all but a fraction of the lines are entries we throw away.
const LANG_HINT = `"lang_code": "${locale}"`
const WORD_HINT = new RegExp(`"word": "[a-zà-öø-ÿ]{${MIN_LEN},${MAX_LEN}}"`)

/**
 * The ladders are played without accents — generate-levels.mjs only ever picks
 * `^[a-z]+$` — while Wiktionary indexes the accented spelling. Keying on the
 * stripped form is what lets the rung "cles" find the entry for "clés"; 186 of
 * the 1123 French rungs are only reachable this way.
 */
function key(word) {
  return word.normalize("NFD").replace(/\p{Diacritic}/gu, "")
}

const words = new Map()
let scanned = 0

const rl = createInterface({
  input: await openDump(SOURCES[locale]),
  crlfDelay: Infinity,
})
for await (const line of rl) {
  scanned++
  if (scanned % 1_000_000 === 0) {
    console.log(`  ${scanned.toLocaleString()} lines, ${words.size} words kept`)
  }
  if (!line.includes(LANG_HINT) || !WORD_HINT.test(line)) continue

  let entry
  try {
    entry = JSON.parse(line)
  } catch {
    continue
  }

  const word = entry.word
  if (entry.lang_code !== locale || typeof word !== "string") continue

  const plain = key(word)
  // The length test is on the stripped form, since that is what the player
  // types. Anything that is not plain a-z once stripped is weight the bundle
  // would carry for nothing.
  if (
    plain.length < MIN_LEN ||
    plain.length > MAX_LEN ||
    !/^[a-z]+$/.test(plain)
  ) {
    continue
  }

  const candidate = bestGloss(entry)
  if (!candidate) continue
  candidate.exact = word === plain

  // Each part of speech is its own entry, so the ranking has to hold across
  // them too: "made" is an obsolete dialect noun before it is the past tense
  // of make, and the dump lists it in that order. Between spellings that strip
  // to the same key ("cote", "côte", "coté"), the unaccented one is the one
  // the player is actually being asked for.
  const held = words.get(plain)
  const better =
    !held ||
    candidate.rank < held.rank ||
    (candidate.rank === held.rank && candidate.exact && !held.exact)
  if (better) words.set(plain, candidate)
}

if (words.size === 0) throw new Error(`Refusing to write an empty ${locale} dictionary`)

const sorted = [...words.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([word, { gloss }]) => ({ word, definition: gloss }))

writeFileSync(
  join(SOURCE_DIR, `${locale}-definitions.json`),
  `${JSON.stringify(sorted, null, 2)}\n`
)

console.log(
  `\nScanned ${scanned.toLocaleString()} lines.` +
    `\nWrote data-sources/${locale}-definitions.json — ${sorted.length} words.`
)
