/**
 * Backend API for levels and launch.
 * Same contract as earthunt useLaunch / useLevel / useFinishLevel.
 *
 * Each app (Earthunt / Wordclimb) uses its own API base URL via env.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://earthunt-api.fly.dev"

export type GameMode = "WORLD" | "CONTINENTS" | "LEVEL_OF_THE_DAY"

export type Continent =
  | "WORLD"
  | "AFRICA"
  | "ASIA"
  | "EUROPE"
  | "AMERICAS"
  | "OCEANIA"
  | "ANTARCTICA"

export type LaunchResponse = {
  userId: string
}

export type LevelResponse = {
  level: number
  countryCodes: string[]
  stats?: DailyLevelStats
}

export type FinishLevelResponse = {
  nextLevel: number
  nextCountryCodes: string[]
  stats?: DailyLevelStats
}

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

export async function postLaunch(body: {
  deviceUUID: string
  brand?: string | null
  osName?: string | null
  osVersion?: string | null
  modelName?: string | null
  manufacturer?: string | null
  deviceType: string
  isDevice?: boolean | null
  gameMode: GameMode
  continent: Continent | ""
}): Promise<LaunchResponse> {
  const res = await fetch(`${API_BASE_URL}/launch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Launch failed: ${res.status}`)
  return res.json()
}

export async function getLevel(params: {
  userId: string
  gameMode: GameMode
  continent?: Continent | ""
  level?: number
}): Promise<LevelResponse> {
  const search = new URLSearchParams({
    userId: params.userId,
    gameMode: params.gameMode,
  })
  if (params.continent) search.set("continent", params.continent)
  if (params.level != null) search.set("level", String(params.level))
  const res = await fetch(`${API_BASE_URL}/level?${search}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) throw new Error(`Get level failed: ${res.status}`)
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

export async function postFinishLevel(body: {
  userId: string
  attempts: number
  timeSpent: number
  hintsUsed: number
  gameMode: GameMode
  continent: Continent | ""
  countryCodes: string[]
}): Promise<FinishLevelResponse> {
  const res = await fetch(`${API_BASE_URL}/level`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Finish level failed: ${res.status}`)
  return res.json()
}
