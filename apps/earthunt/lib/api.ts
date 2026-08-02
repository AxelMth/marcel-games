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

const PROGRESS_TIMEOUT_MS = 10_000
// Level and launch calls block the "start game" tap. Without a timeout, a
// sleeping Fly machine or a restricted network reads as an app freeze — the
// offline fallback can only kick in if these calls give up.
const REQUEST_TIMEOUT_MS = 8_000

/**
 * Thrown when the server responded with a non-2xx status. Distinguishes
 * "the server rejected this" (don't retry) from network failures (retry later)
 * when replaying queued offline results.
 */
export class ApiHttpError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function getProgress(userId: string): Promise<ProgressResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/progress?${new URLSearchParams({ userId })}`,
    { method: "GET", headers: { "Content-Type": "application/json" } },
    PROGRESS_TIMEOUT_MS
  )
  if (!res.ok) throw new ApiHttpError(`Get progress failed: ${res.status}`, res.status)
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
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/launch`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    REQUEST_TIMEOUT_MS
  )
  if (!res.ok) throw new ApiHttpError(`Launch failed: ${res.status}`, res.status)
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
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/level?${search}`,
    { method: "GET", headers: { "Content-Type": "application/json" } },
    REQUEST_TIMEOUT_MS
  )
  if (!res.ok) throw new ApiHttpError(`Get level failed: ${res.status}`, res.status)
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
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/level`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    REQUEST_TIMEOUT_MS
  )
  if (!res.ok) throw new ApiHttpError(`Finish level failed: ${res.status}`, res.status)
  return res.json()
}
