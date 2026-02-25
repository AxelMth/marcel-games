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
  return `${STORAGE_PREFIX}${mode}-${level}-${continent || "world"}-${firstMissingCode}`
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
