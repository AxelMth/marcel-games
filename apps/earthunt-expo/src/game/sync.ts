import {
  EARTHUNT_API_URL,
  createEartHuntApi,
  isLevelResult,
  type HistoryEntry,
  type LevelResult,
} from "@marcel-games/earthunt-core"
import { deviceStore, identityStore, launchDevice, newDeviceId } from "@marcel-games/expo-ui"
import { createGameSync, type Profile } from "@marcel-games/game-sync"
import { daily } from "@/game/daily-store"
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
 * ahead, which is how a reinstall gets its levels back, and today's challenge
 * with the player's rank. The game plays without
 * the server, so a failure here is only reported: the next call tries again.
 */
export async function syncWithServer(): Promise<void> {
  try {
    const userId = await sync.flush()
    await adoptServerProgress(await api.progress(userId))
    await daily.takeServerAnswer(await api.daily(userId))
  } catch (error) {
    console.warn("Sync with the EartHunt server is postponed", error)
  }
}

export function currentUserId(): Promise<string> {
  return sync.flush()
}

export function fetchProfile(): Promise<Profile<HistoryEntry>> {
  return currentUserId().then(api.profile)
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
