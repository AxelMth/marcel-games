"use client"

import { useEffect, useState } from "react"
import { useDeviceUuid } from "./use-device-uuid"
import { postLaunch, type GameMode, type Continent } from "@/lib/api"

export type UseLaunchReturn = {
  userId: string | null
  launch: (gameMode: GameMode, continent: Continent | "") => Promise<string | null>
}

export function useLaunch(): UseLaunchReturn {
  const deviceUuid = useDeviceUuid()
  const [userId, setUserId] = useState<string | null>(null)

  const launch = async (
    gameMode: GameMode,
    continent: Continent | ""
  ): Promise<string | null> => {
    if (!deviceUuid) return null
    try {
      const data = await postLaunch({
        deviceUUID: deviceUuid,
        brand: typeof navigator !== "undefined" ? (navigator as { vendor?: string }).vendor : null,
        osName: typeof navigator !== "undefined" ? navigator.platform : null,
        osVersion: undefined,
        modelName: undefined,
        manufacturer: undefined,
        deviceType: "UNKNOWN",
        isDevice: true,
        gameMode,
        continent,
      })
      setUserId(data.userId)
      return data.userId
    } catch (e) {
      console.error("Launch failed:", e)
      return null
    }
  }

  return { userId, launch }
}
