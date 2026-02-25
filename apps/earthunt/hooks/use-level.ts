"use client"

import {
  getLevel,
  postFinishLevel,
  type GameMode,
  type Continent,
  type LevelResponse,
  type FinishLevelResponse,
} from "@/lib/api"

export type { DailyLevelStats } from "@/lib/api"

export function useLevelApi() {
  async function loadLevel(params: {
    userId: string
    gameMode: GameMode
    continent?: Continent | ""
    level?: number
  }): Promise<LevelResponse> {
    return getLevel(params)
  }

  async function finishLevel(params: {
    userId: string
    attempts: number
    timeSpent: number
    hintsUsed: number
    gameMode: GameMode
    continent: Continent | ""
    countryCodes: string[]
  }): Promise<FinishLevelResponse> {
    return postFinishLevel(params)
  }

  return { loadLevel, finishLevel }
}
