"use client"

import { useState, useCallback } from "react"
import { useDeviceUuid } from "./use-device-uuid"
import { getLaunchDeviceInfo } from "@marcel-games/lib"
import { postLaunch, type GameMode, type Continent } from "@/lib/api"

export type UseLaunchReturn = {
  userId: string | null
  launch: (gameMode: GameMode, continent: Continent | "") => Promise<string | null>
}

export function useLaunch(): UseLaunchReturn {
  const deviceUuid = useDeviceUuid()
  const [userId, setUserId] = useState<string | null>(null)

  const launch = useCallback(
    async (
      gameMode: GameMode,
      continent: Continent | ""
    ): Promise<string | null> => {
      if (!deviceUuid) return null
      try {
        const deviceInfo = await getLaunchDeviceInfo()
        const data = await postLaunch({
          deviceUUID: deviceUuid,
          ...deviceInfo,
          gameMode,
          continent,
        })
        setUserId(data.userId)
        return data.userId
      } catch (e) {
        console.error("Launch failed:", e)
        return null
      }
    },
    [deviceUuid]
  )

  return { userId, launch }
}
