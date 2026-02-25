"use client"

import { useCallback } from "react"
import {
  getLevel,
  postFinishLevel,
  type GameMode,
  type Continent,
  type LevelResponse,
  type FinishLevelResponse,
} from "@/lib/api"

export function useLevelApi() {
  const loadLevel = useCallback(
    async (params: {
      userId: string
      gameMode: GameMode
      continent?: Continent | ""
      level?: number
    }): Promise<LevelResponse> => {
      return getLevel(params)
    },
    []
  )

  const finishLevel = useCallback(
    async (body: {
      userId: string
      attempts: number
      timeSpent: number
      hintsUsed: number
      gameMode: GameMode
      continent: Continent | ""
      countryCodes: string[]
    }): Promise<FinishLevelResponse> => {
      return postFinishLevel(body)
    },
    []
  )

  return { loadLevel, finishLevel }
}
