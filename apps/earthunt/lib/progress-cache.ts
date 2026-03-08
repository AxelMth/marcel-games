import type { ProgressResponse } from "./api"

const CACHE_KEY = "earthunt-progress-cache"

export function getProgressCache(): ProgressResponse | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as ProgressResponse
    if (
      typeof data?.worldLevel !== "number" ||
      typeof data?.continentLevels !== "object" ||
      typeof data?.dailyCompleted !== "boolean"
    ) {
      return null
    }
    return {
      worldLevel: data.worldLevel,
      continentLevels: data.continentLevels ?? {},
      dailyCompleted: data.dailyCompleted,
    }
  } catch {
    return null
  }
}

export function setProgressCache(p: ProgressResponse): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        worldLevel: p.worldLevel,
        continentLevels: p.continentLevels ?? {},
        dailyCompleted: p.dailyCompleted,
      })
    )
  } catch {
    // ignore
  }
}
