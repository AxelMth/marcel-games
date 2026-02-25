import { type Country, type Continent, countries, getCountriesByContinent } from "./countries"

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

export function getMissingCountries(
  levelId: string,
  pool: Country[],
  minMissing: number = 3,
  maxMissing: number = 10
): Country[] {
  const seed = hashString(levelId)
  const shuffled = seededShuffle(pool, seed)
  const count = minMissing + (seed % (maxMissing - minMissing + 1))
  return shuffled.slice(0, Math.min(count, pool.length))
}

export function getDailyLevelId(): string {
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
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

  switch (mode) {
    case "world":
      levelId = getWorldLevelId(level)
      pool = countries
      break
    case "continent":
      levelId = getContinentLevelId(continent!, level)
      pool = getCountriesByContinent(continent!)
      break
    case "daily":
      levelId = getDailyLevelId()
      pool = countries
      break
  }

  const minMissing = Math.min(3 + Math.floor(level / 2), 15)
  const maxMissing = Math.min(5 + level, 20)

  return {
    mode,
    continent,
    level,
    missingCountries: getMissingCountries(levelId, pool, minMissing, maxMissing),
    allCountries: mode === "continent" ? pool : countries,
  }
}

export function normalizeCountryName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z\s-]/g, "")
}

export function matchCountry(input: string, countriesList: Country[]): Country | null {
  const normalized = normalizeCountryName(input)
  if (!normalized) return null
  return (
    countriesList.find(
      (c) =>
        normalizeCountryName(c.nameEn) === normalized ||
        normalizeCountryName(c.nameFr) === normalized
    ) ?? null
  )
}
