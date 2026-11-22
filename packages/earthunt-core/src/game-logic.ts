import { type Country, type Continent, countries, getCountriesByContinent } from "./countries"
import { COUNTRY_DIFFICULTY_ORDER } from "./country-difficulty"

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash)
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const shuffled = [...arr]
  let s = seed
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff
    const j = s % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const DIFFICULTY_RANK = new Map(COUNTRY_DIFFICULTY_ORDER.map((code, i) => [code, i]))

/**
 * How many countries a level asks for.
 *
 * Ported from the curve the server used to apply, which is what players were
 * actually getting: one country up to level 15, then a slow climb. Generating
 * on the client lost it, and levels jumped to six to twelve countries drawn
 * from the whole world — level 7 asked for seven, most of them obscure.
 */
function countForLevel(level: number, seed: number): number {
  // A second value off the same seed, so the count is as reproducible as the
  // draw itself.
  const spread = (n: number) => Math.floor(seed / 7) % n

  if (level <= 15) return 1
  if (level <= 30) return spread(3) + 1
  if (level <= 50) return spread(3) + 2
  if (level <= 100) return spread(4) + 2
  if (level <= 250) return spread(6) + 5
  if (level <= 500) return spread(8) + 8
  if (level <= 1000) return spread(4) + 12
  return spread(6) + 15
}

/**
 * How far down the recognisability order a level is allowed to reach, as a
 * share of the pool. Early levels stay among the countries everyone knows.
 */
function windowForLevel(level: number, poolSize: number): number {
  const share =
    level <= 15 ? 0.1
    : level <= 30 ? 0.2
    : level <= 50 ? 0.3
    : level <= 100 ? 0.4
    : level <= 250 ? 0.6
    : level <= 500 ? 0.75
    : level <= 1000 ? 0.85
    : 1
  return Math.round(poolSize * share)
}

/** The pool, hardest-last, with anything outside the ordering dropped. */
function byRecognisability(pool: Country[]): Country[] {
  return pool
    .filter((c) => DIFFICULTY_RANK.has(c.code))
    .sort((a, b) => DIFFICULTY_RANK.get(a.code)! - DIFFICULTY_RANK.get(b.code)!)
}

/** Neighbours in the recognisability order are shuffled within blocks this size, so the order bends without losing its climb. */
const PROGRESSION_BLOCK = 6

/** One pass through the pool, easiest first, shuffled block by block; each pass is shuffled differently. */
function progressionPass(ordered: Country[], family: string, pass: number): Country[] {
  const result: Country[] = []
  for (let start = 0; start < ordered.length; start += PROGRESSION_BLOCK) {
    const block = ordered.slice(start, start + PROGRESSION_BLOCK)
    result.push(...seededShuffle(block, hashString(`${family}-pass-${pass}-block-${start}`)))
  }
  return result
}

/**
 * The countries a classic level asks for. Levels walk through the pool from
 * the best-known countries to the least known, each taking the next ones in
 * line, so no country comes back before the whole pool has been played and
 * the levels get harder as they go. Once through, the walk starts again with
 * the counts the later levels ask for, several countries at a time.
 */
export function getProgressiveMissingCountries(
  family: string,
  pool: Country[],
  level: number
): Country[] {
  const ordered = byRecognisability(pool)
  if (ordered.length === 0) return []
  const countAt = (n: number) =>
    Math.min(countForLevel(n, hashString(`${family}-level-${n}`)), ordered.length)

  let cursor = 0
  for (let n = 1; n < level; n++) cursor += countAt(n)

  const count = countAt(level)
  const passes = new Map<number, Country[]>()
  const picked: Country[] = []
  for (let i = 0; picked.length < count; i++) {
    const position = cursor + i
    const pass = Math.floor(position / ordered.length)
    if (!passes.has(pass)) passes.set(pass, progressionPass(ordered, family, pass))
    const country = passes.get(pass)![position % ordered.length]
    // At a pass boundary the next pass may start with a country this level already holds.
    if (!picked.includes(country)) picked.push(country)
  }
  return picked
}

export function getMissingCountries(
  levelId: string,
  pool: Country[],
  level: number
): Country[] {
  const seed = hashString(levelId)
  const ordered = byRecognisability(pool)
  if (ordered.length === 0) return []

  const count = Math.min(countForLevel(level, seed), ordered.length)
  // The window can never be smaller than the number of countries to draw, or a
  // small continent pool would hand back fewer than the level asked for.
  const window = Math.min(
    Math.max(windowForLevel(level, ordered.length), count),
    ordered.length
  )

  return seededShuffle(ordered.slice(0, window), seed).slice(0, count)
}

/**
 * Identifies today's challenge, in UTC.
 *
 * The server rotates the daily level at midnight UTC
 * (GetLevelOfTheDayCountryCodes uses time.Now().UTC()), so the client has to
 * agree on where the day starts. Using the device's local day instead would
 * misalign the boundary by the UTC offset: west of UTC the new puzzle would
 * still be filed under yesterday, and east of UTC the old puzzle would already
 * be filed under tomorrow — in both cases the hint keys and the puzzle would
 * belong to different days.
 */
export function getDailyLevelId(): string {
  const now = new Date()
  const dateStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`
  return `daily-${dateStr}`
}

export function getWorldLevelId(level: number): string {
  return `world-level-${level}`
}

export function getContinentLevelId(continent: Continent, level: number): string {
  return `continent-${continent}-level-${level}`
}

export interface GameConfig {
  mode: "world" | "continent" | "daily"
  continent?: Continent
  level: number
  missingCountries: Country[]
  allCountries: Country[]
}

export function createGameConfig(
  mode: "world" | "continent" | "daily",
  level: number = 1,
  continent?: Continent
): GameConfig {
  let levelId: string
  let pool: Country[]
  let family: string | null = null
  // The difficulty the curve is asked for, which is the player's level
  // everywhere except the daily.
  let difficulty = level

  switch (mode) {
    case "world":
      levelId = getWorldLevelId(level)
      pool = countries
      family = "world"
      break
    case "continent":
      levelId = getContinentLevelId(continent!, level)
      pool = getCountriesByContinent(continent!)
      family = `continent-${continent}`
      break
    case "daily":
      levelId = getDailyLevelId()
      pool = countries
      // The daily is always "level 1", so reading the curve at that level would
      // make it a single easy country every day. The server picks a level
      // between 1 and 50 for it; derive the same range from the date so the
      // offline daily is a real puzzle too.
      difficulty = 1 + (hashString(levelId) % 50)
      break
  }

  return {
    mode,
    continent,
    level,
    missingCountries:
      family === null
        ? getMissingCountries(levelId, pool, difficulty)
        : getProgressiveMissingCountries(family, pool, level),
    allCountries: mode === "continent" ? pool : countries,
  }
}

/**
 * Builds the same params shape as a GET /level response, from the local
 * deterministic generator. Used as the offline fallback when the API is
 * unreachable, so screens can feed it straight into setGameFromLevel.
 */
export function buildOfflineLevelParams(
  mode: "world" | "continent" | "daily",
  level: number,
  continent?: Continent
): {
  mode: "world" | "continent" | "daily"
  level: number
  continent?: Continent
  countryCodes: string[]
  allCountries: Country[]
} {
  const config = createGameConfig(mode, level, continent)
  return {
    mode,
    level,
    continent,
    countryCodes: config.missingCountries.map((c) => c.code),
    allCountries: config.allCountries,
  }
}

export function normalizeCountryName(name: string): string {
  // Fold diacritics before stripping so "Brésil" and "Bresil" both become "bresil".
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z\s-]/g, "")
}

/**
 * Other names players type for a country, keyed by its code. Only names that
 * point at a single country belong here: "Congo" or "Guinea" would be guesses.
 */
const ALIASES: Readonly<Record<string, readonly string[]>> = {
  USA: ["usa", "us", "etats-unis d'amerique", "united states of america", "amerique"],
  GBR: ["uk", "angleterre", "england", "great britain", "grande-bretagne"],
  ARE: ["uae", "eau", "emirats"],
  CZE: ["czechia", "tchequie", "republique tcheque"],
  NLD: ["hollande", "holland"],
  MMR: ["birmanie", "burma"],
  MKD: ["macedoine"],
  SWZ: ["eswatini"],
}

// Spaces, hyphens and dots are dropped, so "Royaume Uni", "Royaume-Uni" and
// "U.S.A." all reach the same name.
function matchKey(name: string): string {
  return normalizeCountryName(name).replace(/[\s-]/g, "")
}

function keysOf(country: Country): string[] {
  return [country.nameEn, country.nameFr, ...(ALIASES[country.code] ?? [])].map(matchKey)
}

export function matchCountry(input: string, countriesList: Country[]): Country | null {
  const key = matchKey(input)
  if (!key) return null
  return countriesList.find((c) => keysOf(c).includes(key)) ?? null
}

/** Countries whose name, or an alias, has a word starting with what was typed. Found ones are left out. */
export function suggestCountries(
  input: string,
  countriesList: readonly Country[],
  foundCodes: readonly string[],
  locale: "en" | "fr",
  limit = 4
): Country[] {
  const prefix = normalizeCountryName(input).replace(/-/g, " ").trim()
  if (prefix.length < MIN_SUGGEST_LENGTH) return []
  const matches = (name: string) =>
    normalizeCountryName(name)
      .replace(/-/g, " ")
      .split(/\s+/)
      .some((word) => word.startsWith(prefix)) ||
    normalizeCountryName(name).replace(/-/g, " ").startsWith(prefix)
  return countriesList
    .filter(
      (country) =>
        !foundCodes.includes(country.code) &&
        [country.nameEn, country.nameFr, ...(ALIASES[country.code] ?? [])].some(matches)
    )
    .sort((a, b) => {
      const name = (c: Country) => (locale === "fr" ? c.nameFr : c.nameEn)
      const starts = (c: Country) => (normalizeCountryName(name(c)).startsWith(prefix) ? 0 : 1)
      return starts(a) - starts(b) || name(a).localeCompare(name(b), locale)
    })
    .slice(0, limit)
}

const MIN_SUGGEST_LENGTH = 2
