import { deviceStore, identityStore, launchDevice, newDeviceId } from "@marcel-games/expo-ui"
import { createGameSync } from "@marcel-games/game-sync"
import {
  WORDCLIMB_API_URL,
  createWordClimbApi,
  isLevelResult,
  toBackendLocale,
  type LevelResult,
} from "@marcel-games/wordclimb-core"
import { adoptServerProgress } from "@/game/progress-store"
import { deviceLocale } from "@/lib/locale"

const api = createWordClimbApi(process.env.EXPO_PUBLIC_API_BASE_URL ?? WORDCLIMB_API_URL)

const sync = createGameSync<LevelResult>({
  store: deviceStore,
  identityStore,
  namespace: "wordclimb",
  isResult: isLevelResult,
  newDeviceId,
  launch: (deviceId) => api.launch(deviceId, launchDevice(), toBackendLocale(deviceLocale())),
  send: api.finishLevel,
})

/**
 * Sends what was played offline, then takes the server's progress if it is
 * ahead, which is how a reinstall gets its levels back. The game plays without
 * the server, so a failure here is only reported: the next call tries again.
 */
export async function syncWithServer(): Promise<void> {
  try {
    const userId = await sync.flush()
    await adoptServerProgress(await api.classicLevelsFinished(userId))
  } catch (error) {
    console.warn("Sync with the WordClimb server is postponed", error)
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
