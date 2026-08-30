/**
 * WordClimb backend API client.
 *
 * Every request goes through apiUrl(), and every path is declared in
 * API_PATHS. Phase 1 merges the two games behind a single Go server where
 * WordClimb lives under /wordclimb/*: when that lands, only API_PATHS changes.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://wordclimb-api.fly.dev"

/**
 * Paths on the backend, relative to API_BASE_URL. The single place to edit
 * when the unified server puts these behind a /wordclimb prefix.
 */
export const API_PATHS = {
  launch: "/launch",
  level: "/level",
  progress: "/progress",
  profile: "/profile",
} as const

function apiUrl(path: string, params?: Record<string, string>): string {
  const query = params ? `?${new URLSearchParams(params)}` : ""
  return `${API_BASE_URL}${path}${query}`
}

/** Game modes as declared by the GameMode enum in the server's schema.prisma. */
export type BackendGameMode = "NORMAL" | "RANDOM" | "LEVEL_OF_THE_DAY"

/** Languages as declared by the Locale enum in the server's schema.prisma. */
export type BackendLocale = "EN" | "FR"

export type LevelPayload = {
  beginWord: string
  endWord: string
  /** Intermediate words only, in order from begin to end. */
  wordLadder: string[]
}

export type DailyLevelStats = {
  dailyLevelsCompleted: number
  lastLevelRank: number
  globalRank: number
}

export type LaunchResponse = {
  userId: string
  level: number
  /** Hint balance. Absent from a server that predates coins. */
  coins?: number
} & LevelPayload

export type LevelResponse = {
  level: number
  stats?: DailyLevelStats
} & LevelPayload

export type FinishLevelResponse = {
  nextLevel: number
  nextBeginWord: string
  nextEndWord: string
  nextWordLadder: string[]
  stats?: DailyLevelStats
  /** Hint balance after this level was charged. */
  coins?: number
}

export type ProgressResponse = {
  /** Progression of the NORMAL mode. Named after earthunt's field, shown as "Classic". */
  worldLevel: number
  randomLevel: number
  dailyCompleted: boolean
  stats?: DailyLevelStats
  /** Hint balance, refilled weekly by the server. */
  coins?: number
}

export type GameHistoryEntry = {
  level: number
  gameMode: string
  beginWord: string
  endWord: string
  /** Intermediate words only; the two ends are re-inserted for display. */
  wordLadder: string[]
  stars: number
  rank: number
}

export type ProfileResponse = {
  gameHistory: GameHistoryEntry[]
  stats: DailyLevelStats
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

const JSON_HEADERS = { "Content-Type": "application/json" }

async function getJson<T>(
  url: string,
  what: string,
  timeoutMs: number
): Promise<T> {
  const res = await fetchWithTimeout(
    url,
    { method: "GET", headers: JSON_HEADERS },
    timeoutMs
  )
  if (!res.ok) throw new ApiHttpError(`${what} failed: ${res.status}`, res.status)
  return res.json()
}

async function postJson<T>(url: string, body: unknown, what: string): Promise<T> {
  const res = await fetchWithTimeout(
    url,
    { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(body) },
    REQUEST_TIMEOUT_MS
  )
  if (!res.ok) throw new ApiHttpError(`${what} failed: ${res.status}`, res.status)
  return res.json()
}

/**
 * Registers the device and returns the server-side userId every other call
 * needs. The device UUID identifies the device; the userId identifies the row.
 */
export async function postLaunch(body: {
  deviceUUID: string
  brand?: string | null
  osName?: string | null
  osVersion?: string | null
  modelName?: string | null
  manufacturer?: string | null
  deviceType: string
  isDevice?: boolean | null
  gameMode: BackendGameMode
  locale: BackendLocale
}): Promise<LaunchResponse> {
  return postJson<LaunchResponse>(apiUrl(API_PATHS.launch), body, "Launch")
}

export async function getLevel(params: {
  userId: string
  gameMode: BackendGameMode
  locale: BackendLocale
}): Promise<LevelResponse> {
  return getJson<LevelResponse>(
    apiUrl(API_PATHS.level, {
      userId: params.userId,
      gameMode: params.gameMode,
      locale: params.locale,
    }),
    "Get level",
    REQUEST_TIMEOUT_MS
  )
}

export async function postFinishLevel(body: {
  userId: string
  attempts: number
  timeSpent: number
  hintsUsed: number
  gameMode: BackendGameMode
  locale: BackendLocale
  beginWord: string
  endWord: string
  wordLadder: string[]
  /** Coins spent on hints. Absent on results queued before coins existed. */
  coinsSpent?: number
}): Promise<FinishLevelResponse> {
  return postJson<FinishLevelResponse>(apiUrl(API_PATHS.level), body, "Finish level")
}

export async function getProgress(userId: string): Promise<ProgressResponse> {
  return getJson<ProgressResponse>(
    apiUrl(API_PATHS.progress, { userId }),
    "Get progress",
    PROGRESS_TIMEOUT_MS
  )
}

export async function getProfile(userId: string): Promise<ProfileResponse> {
  return getJson<ProfileResponse>(
    apiUrl(API_PATHS.profile, { userId }),
    "Get profile",
    REQUEST_TIMEOUT_MS
  )
}
