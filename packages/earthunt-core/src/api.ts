import {
  isCount,
  isHistoryBase,
  isRecord,
  parseDailyStats,
  parseLaunchedUserId,
  parseProfile,
  requestJson,
  type DailyAnswer,
  type HistoryBase,
  type LaunchDevice,
  type Profile,
} from "@marcel-games/game-sync"
import type { Continent } from "./countries"

export const EARTHUNT_API_URL = "https://earthunt-api.fly.dev"

/** A finished level as the server stores it. `continent` is empty for a world level. */
export interface LevelResult {
  attempts: number
  /** Seconds. */
  timeSpent: number
  hintsUsed: number
  gameMode: "WORLD" | "CONTINENTS" | "LEVEL_OF_THE_DAY"
  continent: Continent | ""
  countryCodes: string[]
}

const CONTINENTS: readonly Continent[] = [
  "AFRICA",
  "ASIA",
  "EUROPE",
  "AMERICAS",
  "OCEANIA",
  "ANTARCTICA",
]

const GAME_MODES: readonly unknown[] = ["WORLD", "CONTINENTS", "LEVEL_OF_THE_DAY"]

export function isCountryCodes(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((code) => typeof code === "string")
}

export function isLevelResult(value: unknown): value is LevelResult {
  return (
    isRecord(value) &&
    isCount(value.attempts) &&
    isCount(value.timeSpent) &&
    isCount(value.hintsUsed) &&
    GAME_MODES.includes(value.gameMode) &&
    (value.continent === "" || CONTINENTS.some((continent) => continent === value.continent)) &&
    isCountryCodes(value.countryCodes)
  )
}

/** The level each mode is at on the server. Levels start at 1. */
export interface ServerProgress {
  world: number
  continents: Partial<Record<Continent, number>>
}

function isLevel(value: unknown): value is number {
  return isCount(value) && value >= 1
}

function parseProgress(data: unknown): ServerProgress {
  if (!isRecord(data) || !isLevel(data.worldLevel) || !isRecord(data.continentLevels)) {
    throw new Error("The progress answer carries no levels")
  }
  const continents: ServerProgress["continents"] = {}
  for (const continent of CONTINENTS) {
    const level = data.continentLevels[continent]
    if (isLevel(level)) continents[continent] = level
  }
  return { world: data.worldLevel, continents }
}

function parseDaily(data: unknown): DailyAnswer<string[]> {
  if (!isRecord(data) || !isCountryCodes(data.countryCodes)) {
    throw new Error("The daily answer carries no countries")
  }
  return {
    puzzle: data.countryCodes.length > 0 ? data.countryCodes : null,
    stats: parseDailyStats(data.stats),
  }
}

/** A level in the player's history. `continent` is empty for a world level or a daily challenge. */
export interface HistoryEntry extends HistoryBase {
  continent: string
}

export function isHistoryEntry(value: unknown): value is HistoryEntry {
  return isHistoryBase(value) && typeof (value as { continent?: unknown }).continent === "string"
}

export interface EartHuntApi {
  /** Registers the device and answers the server's id for its player. */
  launch: (deviceUUID: string, device: LaunchDevice) => Promise<string>
  finishLevel: (userId: string, result: LevelResult) => Promise<void>
  progress: (userId: string) => Promise<ServerProgress>
  /** Today's challenge, without countries once the player has finished it. */
  daily: (userId: string) => Promise<DailyAnswer<string[]>>
  profile: (userId: string) => Promise<Profile<HistoryEntry>>
}

export function createEartHuntApi(baseUrl: string): EartHuntApi {
  return {
    launch: (deviceUUID, device) =>
      requestJson(
        `${baseUrl}/launch`,
        { method: "POST", body: { deviceUUID, ...device, gameMode: "WORLD", continent: "" } },
        parseLaunchedUserId
      ),
    finishLevel: (userId, result) =>
      requestJson(`${baseUrl}/level`, { method: "POST", body: { userId, ...result } }, () => undefined),
    progress: (userId) =>
      requestJson(
        `${baseUrl}/progress?userId=${encodeURIComponent(userId)}`,
        { method: "GET" },
        parseProgress
      ),
    daily: (userId) =>
      requestJson(
        `${baseUrl}/level?userId=${encodeURIComponent(userId)}&gameMode=LEVEL_OF_THE_DAY`,
        { method: "GET" },
        parseDaily
      ),
    profile: (userId) =>
      requestJson(
        `${baseUrl}/profile?userId=${encodeURIComponent(userId)}`,
        { method: "GET" },
        (data) => parseProfile(data, isHistoryEntry)
      ),
  }
}
