import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSyncExternalStore } from "react"

const STORAGE_KEY = "wordclimb-classic-progress"

export type ProgressState =
  | { status: "loading" }
  | { status: "ready"; progress: number }
  | { status: "error" }

let state: ProgressState = { status: "loading" }
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

function publish(next: ProgressState): void {
  state = next
  for (const listener of listeners) listener()
}

function parseProgress(stored: string | null): number {
  if (stored === null) return 0
  const value = Number.parseInt(stored, 10)
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Stored progress is not a level count: "${stored}"`)
  }
  return value
}

/**
 * Reads the number of classic levels finished on this device.
 *
 * A failed read ends in "error", never in a quiet zero: starting from level 1
 * and then saving would overwrite the progress that could not be read.
 */
export function loadProgress(): Promise<void> {
  loading ??= AsyncStorage.getItem(STORAGE_KEY)
    .then((stored) => publish({ status: "ready", progress: parseProgress(stored) }))
    .catch((error: unknown) => {
      console.error("Could not read classic progress", error)
      loading = null
      publish({ status: "error" })
    })
  return loading
}

export function retryLoadProgress(): Promise<void> {
  publish({ status: "loading" })
  return loadProgress()
}

/**
 * Banks a finished classic level. The new count is shown at once and persisted
 * behind. Replaying a level already banked changes nothing and answers false,
 * so a reward is only ever paid once per level.
 */
export async function bankClassicLevel(levelIndex: number): Promise<boolean> {
  await loadProgress()
  if (state.status !== "ready" || levelIndex < state.progress) return false
  const progress = levelIndex + 1
  publish({ status: "ready", progress })
  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(progress))
  } catch (error) {
    console.error("Could not save classic progress", error)
  }
  return true
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): ProgressState {
  return state
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
