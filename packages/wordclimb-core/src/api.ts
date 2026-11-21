import {
  isCount,
  isRecord,
  parseDailyStats,
  parseLaunchedUserId,
  requestJson,
  type DailyAnswer,
  type LaunchDevice,
} from "@marcel-games/game-sync"
import type { Level } from "./catalogue"
import { levelFromApi, type BackendGameMode, type BackendLocale } from "./game"

export const WORDCLIMB_API_URL = "https://wordclimb-api.fly.dev"

/** A finished level as the server stores it. `wordLadder` is the intermediate words only. */
export interface LevelResult {
  attempts: number
  /** Seconds. */
  timeSpent: number
  hintsUsed: number
  gameMode: BackendGameMode
  locale: BackendLocale
  beginWord: string
  endWord: string
  wordLadder: string[]
}

const GAME_MODES: readonly unknown[] = ["NORMAL", "RANDOM", "LEVEL_OF_THE_DAY"]
const LOCALES: readonly unknown[] = ["EN", "FR"]

export function isLevelResult(value: unknown): value is LevelResult {
  return (
    isRecord(value) &&
    isCount(value.attempts) &&
    isCount(value.timeSpent) &&
    isCount(value.hintsUsed) &&
    GAME_MODES.includes(value.gameMode) &&
    LOCALES.includes(value.locale) &&
    typeof value.beginWord === "string" &&
    typeof value.endWord === "string" &&
    Array.isArray(value.wordLadder) &&
    value.wordLadder.every((word) => typeof word === "string")
  )
}

export function isLevel(value: unknown): value is Level {
  return (
    isRecord(value) &&
    isCount(value.id) &&
    typeof value.beginWord === "string" &&
    typeof value.endWord === "string" &&
    Array.isArray(value.wordLadder) &&
    value.wordLadder.every((word) => typeof word === "string")
  )
}

function parseDaily(data: unknown): DailyAnswer<Level> {
  if (
    !isRecord(data) ||
    typeof data.beginWord !== "string" ||
    typeof data.endWord !== "string" ||
    !Array.isArray(data.wordLadder) ||
    !data.wordLadder.every((word) => typeof word === "string")
  ) {
    throw new Error("The daily answer carries no ladder")
  }
  const { beginWord, endWord, wordLadder } = data
  return {
    puzzle: levelFromApi({ beginWord, endWord, wordLadder }),
    stats: parseDailyStats(data.stats),
  }
}

export interface WordClimbApi {
  /** Registers the device and answers the server's id for its player. */
  launch: (deviceUUID: string, device: LaunchDevice, locale: BackendLocale) => Promise<string>
  finishLevel: (userId: string, result: LevelResult) => Promise<void>
  /** How many classic levels the server has banked for this player. */
  classicLevelsFinished: (userId: string) => Promise<number>
  /** Today's challenge, without a puzzle once the player has finished it. */
  daily: (userId: string, locale: BackendLocale) => Promise<DailyAnswer<Level>>
}

export function createWordClimbApi(baseUrl: string): WordClimbApi {
  return {
    launch: (deviceUUID, device, locale) =>
      requestJson(
        `${baseUrl}/launch`,
        { method: "POST", body: { deviceUUID, ...device, gameMode: "NORMAL", locale } },
        parseLaunchedUserId
      ),
    finishLevel: (userId, result) =>
      requestJson(`${baseUrl}/level`, { method: "POST", body: { userId, ...result } }, () => undefined),
    classicLevelsFinished: (userId) =>
      requestJson(
        `${baseUrl}/progress?userId=${encodeURIComponent(userId)}`,
        { method: "GET" },
        (data) => {
          // The server answers the level about to be played, which starts at 1.
          if (!isRecord(data) || !isCount(data.worldLevel) || data.worldLevel < 1) {
            throw new Error("The progress answer carries no classic level")
          }
          return data.worldLevel - 1
        }
      ),
    daily: (userId, locale) =>
      requestJson(
        `${baseUrl}/level?userId=${encodeURIComponent(userId)}&gameMode=LEVEL_OF_THE_DAY&locale=${locale}`,
        { method: "GET" },
        parseDaily
      ),
  }
}
