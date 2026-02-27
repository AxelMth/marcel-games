/**
 * WordClimb API client for progress and profile (stats).
 * Calls the shared backend API, same code as Earthunt but with its own
 * API base URL configured via environment.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://wordclimb-api.fly.dev"

// Earthunt-style progress response from /progress
export type DailyLevelStats = {
  dailyLevelsCompleted: number
  lastLevelRank: number
  globalRank: number
}

export type ProgressResponse = {
  worldLevel: number
  continentLevels: Record<string, number>
  dailyCompleted: boolean
  stats?: DailyLevelStats
}

// Earthunt-style profile response from /profile
export type GameHistoryEntry = {
  level: number
  gameMode: string
  continent: string
  stars: number
  rank: number
}

export type ProfileStats = {
  dailyLevelsCompleted: number
  lastLevelRank: number
  globalRank: number
}

export type ProfileResponse = {
  gameHistory: GameHistoryEntry[]
  stats: ProfileStats
}

export async function getProgress(userId: string): Promise<ProgressResponse> {
  const res = await fetch(
    `${API_BASE_URL}/progress?${new URLSearchParams({ userId })}`,
    { method: "GET", headers: { "Content-Type": "application/json" } }
  )
  if (!res.ok) throw new Error(`Get progress failed: ${res.status}`)
  return res.json()
}

export async function getProfile(userId: string): Promise<ProfileResponse> {
  const res = await fetch(
    `${API_BASE_URL}/profile?${new URLSearchParams({ userId })}`,
    { method: "GET", headers: { "Content-Type": "application/json" } }
  )
  if (!res.ok) throw new Error(`Get profile failed: ${res.status}`)
  return res.json()
}
