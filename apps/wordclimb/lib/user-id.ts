import { storage } from "@marcel-games/lib"

/**
 * The server-side user id returned by POST /launch.
 *
 * It is not the device UUID: the device UUID identifies the handset, the userId
 * identifies the row the backend keeps for it. Every other endpoint takes the
 * userId, so it is persisted rather than held in memory — otherwise a cold start
 * without network leaves the stats and progress screens with nothing to ask for.
 *
 * Stored through the shared storage layer, which is Capacitor Preferences on
 * native: iOS can evict localStorage under storage pressure, and losing this id
 * orphans a player's history.
 */
const STORAGE_KEY = "wordclimb-user-id"

export async function readStoredUserId(): Promise<string | null> {
  try {
    return await storage.get(STORAGE_KEY)
  } catch {
    return null
  }
}

export async function storeUserId(userId: string): Promise<void> {
  try {
    await storage.set(STORAGE_KEY, userId)
  } catch {
    // A userId that survives only this session still plays fine; failing the
    // launch over it would not.
  }
}
