import {
  isCount,
  isRecord,
  parseLaunchedUserId,
  requestJson,
  type LaunchDevice,
} from "@marcel-games/game-sync"
import type { Continent } from "./countries"

export const EARTHUNT_API_URL = "https://earthunt-api.fly.dev"

/** A finished level as the server stores it. `continent` is empty for a world level. */
export interface LevelResult {
  attempts: number
  /** Seconds. */
  timeSpent: number
  hintsUsed: number
  gameMode: "WORLD" | "CONTINENTS"
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

export function isLevelResult(value: unknown): value is LevelResult {
  return (
    isRecord(value) &&
    isCount(value.attempts) &&
    isCount(value.timeSpent) &&
    isCount(value.hintsUsed) &&
    (value.gameMode === "WORLD" || value.gameMode === "CONTINENTS") &&
    (value.continent === "" || CONTINENTS.some((continent) => continent === value.continent)) &&
    Array.isArray(value.countryCodes) &&
    value.countryCodes.every((code) => typeof code === "string")
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

export interface EartHuntApi {
  /** Registers the device and answers the server's id for its player. */
  launch: (deviceUUID: string, device: LaunchDevice) => Promise<string>
  finishLevel: (userId: string, result: LevelResult) => Promise<void>
  progress: (userId: string) => Promise<ServerProgress>
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
  }
}
