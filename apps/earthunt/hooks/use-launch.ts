"use client"

import { useCallback } from "react"
import { useDeviceUUID } from "@marcel-games/lib"
import { postLaunch, type GameMode, type Continent } from "@/lib/api"

/**
 * Calls /launch with the device UUID and returns the userId.
 * Uses the shared useDeviceUUID hook from @marcel-games/lib.
 */
export function useLaunch() {
  const { getUUID } = useDeviceUUID()

  const launch = useCallback(
    async (gameMode: GameMode, continent: Continent | ""): Promise<string | null> => {
      try {
        const deviceUUID = getUUID()
        const data = await postLaunch({
          deviceUUID,
          brand: null,
          osName: null,
          osVersion: null,
          modelName: null,
          manufacturer: null,
          deviceType: "unknown",
          isDevice: null,
          gameMode,
          continent,
        })
        return data.userId
      } catch (err) {
        console.error("[useLaunch] failed:", err)
        return null
      }
    },
    [getUUID]
  )

  return { launch }
}
