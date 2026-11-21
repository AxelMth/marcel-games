import {
  EARTHUNT_API_URL,
  createEartHuntApi,
  isLevelResult,
  type LevelResult,
} from "@marcel-games/earthunt-core"
import { deviceStore, identityStore, launchDevice, newDeviceId } from "@marcel-games/expo-ui"
import { createGameSync } from "@marcel-games/game-sync"
import { adoptServerProgress } from "@/game/progress-store"

const api = createEartHuntApi(process.env.EXPO_PUBLIC_API_BASE_URL ?? EARTHUNT_API_URL)

const sync = createGameSync<LevelResult>({
  store: deviceStore,
  identityStore,
  namespace: "earthunt",
  isResult: isLevelResult,
  newDeviceId,
  launch: (deviceId) => api.launch(deviceId, launchDevice()),
  send: api.finishLevel,
})

/**
 * Sends what was played offline, then takes the server's progress where it is
 * ahead, which is how a reinstall gets its levels back. The game plays without
 * the server, so a failure here is only reported: the next call tries again.
 */
export async function syncWithServer(): Promise<void> {
  try {
    const userId = await sync.flush()
    await adoptServerProgress(await api.progress(userId))
  } catch (error) {
    console.warn("Sync with the EartHunt server is postponed", error)
  }
}

let firstSync: Promise<void> | null = null

/**
 * Settles once the server has been asked for the player's progress, whether it
 * answered or not. A level is banked after this, so that one replayed right
 * after a reinstall is recognised as already finished instead of being sent
 * a second time.
 */
export function whenFirstSynced(): Promise<void> {
  firstSync ??= syncWithServer()
  return firstSync
}

export async function reportLevel(result: LevelResult): Promise<void> {
  try {
    await sync.record(result)
  } catch (error) {
    console.error("Could not store a finished level for the server", error)
  }
  await syncWithServer()
}
