import type { ProgressResponse } from "./api"

/**
 * The last progression the server confirmed, kept so the home screen has
 * something true to show when it cannot be asked again.
 *
 * Without it, an offline launch rendered "Level 1" to a player forty levels in:
 * the carousel reads the API's answer, and a failed call left that null. The
 * local completion counter alone could not fill the gap either — it only counts
 * levels finished on this device, so a reinstall would understate it.
 *
 * Cached values are never authoritative. A successful call overwrites this, and
 * the reader takes whichever of cache and local counter is further along.
 */
const CACHE_KEY = "wordclimb-progress-cache"

export function getProgressCache(): ProgressResponse | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as ProgressResponse
    // Shape-checked rather than trusted: this is storage another version of
    // the app wrote, and a half-read object would render as NaN on screen.
    if (
      typeof data?.worldLevel !== "number" ||
      typeof data?.randomLevel !== "number" ||
      typeof data?.dailyCompleted !== "boolean"
    ) {
      return null
    }
    return {
      worldLevel: data.worldLevel,
      randomLevel: data.randomLevel,
      dailyCompleted: data.dailyCompleted,
    }
  } catch {
    return null
  }
}

export function setProgressCache(p: ProgressResponse): void {
  if (typeof window === "undefined") return
  try {
    // Stats are deliberately not cached: ranks age badly, and the stats screen
    // requires a live connection anyway.
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        worldLevel: p.worldLevel,
        randomLevel: p.randomLevel,
        dailyCompleted: p.dailyCompleted,
      })
    )
  } catch {
    // Storage full or unavailable — a stale home screen is not worth throwing.
  }
}
