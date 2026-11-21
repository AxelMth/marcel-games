import type { Continent } from "@marcel-games/earthunt-core"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSyncExternalStore } from "react"

const STORAGE_KEY = "earthunt-progress"

/** The level each mode is at. Levels start at 1; a continent never played is absent. */
export interface Progress {
  world: number
  continents: Partial<Record<Continent, number>>
}

export type ProgressState =
  | { status: "loading" }
  | { status: "ready"; progress: Progress }
  | { status: "error" }

let state: ProgressState = { status: "loading" }
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

function publish(next: ProgressState): void {
  state = next
  for (const listener of listeners) listener()
}

function isLevel(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1
}

function parseProgress(stored: string | null): Progress {
  if (stored === null) return { world: 1, continents: {} }
  const data: unknown = JSON.parse(stored)
  if (
    typeof data !== "object" ||
    data === null ||
    !("world" in data) ||
    !("continents" in data) ||
    !isLevel(data.world) ||
    typeof data.continents !== "object" ||
    data.continents === null ||
    !Object.values(data.continents).every(isLevel)
  ) {
    throw new Error(`Stored progress is not a progress record: ${stored}`)
  }
  return { world: data.world, continents: data.continents as Progress["continents"] }
}

/**
 * Reads the levels reached on this device.
 *
 * A failed read ends in "error", never in a quiet level 1: playing from there
 * and saving would overwrite the progress that could not be read.
 */
export function loadProgress(): Promise<void> {
  loading ??= AsyncStorage.getItem(STORAGE_KEY)
    .then((stored) => publish({ status: "ready", progress: parseProgress(stored) }))
    .catch((error: unknown) => {
      console.error("Could not read progress", error)
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
 * Banks a finished level. Replaying one already passed changes nothing and
 * answers false, so a level is only ever reported once.
 */
export async function bankLevel(level: number, continent?: Continent): Promise<boolean> {
  await loadProgress()
  if (state.status !== "ready") return false
  const { progress } = state
  const reached = continent ? (progress.continents[continent] ?? 1) : progress.world
  if (level < reached) return false

  const next: Progress = continent
    ? { ...progress, continents: { ...progress.continents, [continent]: level + 1 } }
    : { ...progress, world: level + 1 }
  publish({ status: "ready", progress: next })
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch (error) {
    console.error("Could not save progress", error)
  }
  return true
}

/** Takes the server's levels where they are ahead of this device, as after a reinstall. */
export async function adoptServerProgress(server: Progress): Promise<void> {
  await loadProgress()
  if (state.status !== "ready") return
  const { progress } = state
  const continents = { ...progress.continents }
  for (const [continent, level] of Object.entries(server.continents) as [Continent, number][]) {
    continents[continent] = Math.max(level, continents[continent] ?? 1)
  }
  const next: Progress = { world: Math.max(server.world, progress.world), continents }
  if (JSON.stringify(next) === JSON.stringify(progress)) return
  publish({ status: "ready", progress: next })
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch (error) {
    console.error("Could not save the progress the server answered", error)
  }
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
