import { getDailyLevelId } from "./game-logic"

const STORAGE_PREFIX = "earthunt-hints-"

export interface PersistedHints {
  letter?: string
  map?: boolean
  name?: string
}

function getStorageKey(
  mode: string,
  level: number,
  continent: string,
  firstMissingCode: string
): string {
  // The daily challenge is always level 1, so the level number cannot tell two
  // days apart. Without the date, a hint paid for yesterday would silently
  // unlock today's challenge whenever the same country came up first again.
  // World and continent levels keep their level number: a level in progress
  // must survive midnight.
  const scope = mode === "daily" ? getDailyLevelId() : String(level)
  return `${STORAGE_PREFIX}${mode}-${scope}-${continent || "world"}-${firstMissingCode}`
}

export function getPersistedHints(
  mode: string,
  level: number,
  continent: string,
  firstMissingCode: string
): PersistedHints | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(
      getStorageKey(mode, level, continent, firstMissingCode)
    )
    if (!raw) return null
    return JSON.parse(raw) as PersistedHints
  } catch {
    return null
  }
}

/**
 * How many hints were already paid for on this level, across every country.
 *
 * The hints themselves survive a relaunch (localStorage) but the store's
 * hintsUsed counter does not, so a resumed level would be scored as if no hint
 * had ever been taken — up to 3 stars despite the help, and a false hintsUsed
 * posted to the server.
 *
 * Counts every country of the level, not just the first one still missing: a
 * previous session may have bought hints on several countries before being
 * killed. Tests the value rather than the key so a stored `map: false` is not
 * miscounted.
 */
export function countPersistedHints(
  mode: string,
  level: number,
  continent: string,
  countryCodes: string[]
): number {
  return countryCodes.reduce((total, code) => {
    const hints = getPersistedHints(mode, level, continent, code)
    if (!hints) return total
    return (
      total + (hints.letter ? 1 : 0) + (hints.map ? 1 : 0) + (hints.name ? 1 : 0)
    )
  }, 0)
}

export function setPersistedHint(
  mode: string,
  level: number,
  continent: string,
  firstMissingCode: string,
  type: "letter" | "map" | "name",
  value: string | boolean
): void {
  if (typeof window === "undefined") return
  try {
    const key = getStorageKey(mode, level, continent, firstMissingCode)
    const existing = getPersistedHints(mode, level, continent, firstMissingCode) ?? {}
    const updated = { ...existing, [type]: value }
    localStorage.setItem(key, JSON.stringify(updated))
  } catch {
    // ignore
  }
}
