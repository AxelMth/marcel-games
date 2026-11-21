import {
  dailyDone,
  dailyFromServer,
  isDaily,
  utcDay,
  type Daily,
  type DailyAnswer,
} from "@marcel-games/game-sync"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSyncExternalStore } from "react"

export interface DailyStore<Puzzle> {
  load: () => Promise<void>
  /** Today's challenge as the device knows it, or null when it knows nothing about today. */
  today: () => Daily<Puzzle> | null
  useToday: () => Daily<Puzzle> | null
  takeServerAnswer: (answer: DailyAnswer<Puzzle>) => Promise<void>
  markDone: () => Promise<void>
}

/** Today's daily challenge, kept across launches so a finished day stays finished offline. */
export function createDailyStore<Puzzle>(
  storageKey: string,
  isPuzzle: (puzzle: unknown) => puzzle is Puzzle
): DailyStore<Puzzle> {
  let known: Daily<Puzzle> | null = null
  let loading: Promise<void> | null = null
  const listeners = new Set<() => void>()

  const parse = (stored: string | null): Daily<Puzzle> | null => {
    if (stored === null) return null
    const data: unknown = JSON.parse(stored)
    if (!isDaily(data, isPuzzle)) throw new Error(`Stored daily challenge is damaged: ${stored}`)
    return data
  }

  // A daily that cannot be read is only a day's state: the game starts from
  // nothing and asks the server again.
  const load = (): Promise<void> => {
    loading ??= AsyncStorage.getItem(storageKey)
      .then((stored) => {
        known = parse(stored)
      })
      .catch((error: unknown) => {
        console.error("Could not read the daily challenge", error)
      })
      .then(() => {
        for (const listener of listeners) listener()
      })
    return loading
  }

  const publish = async (next: Daily<Puzzle>): Promise<void> => {
    known = next
    for (const listener of listeners) listener()
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(next))
    } catch (error) {
      console.error("Could not save the daily challenge", error)
    }
  }

  const today = (): Daily<Puzzle> | null => (known?.day === utcDay(new Date()) ? known : null)

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  return {
    load,
    today,
    useToday: () => useSyncExternalStore(subscribe, today, today),
    async takeServerAnswer(answer) {
      await load()
      await publish(dailyFromServer(known, utcDay(new Date()), answer))
    },
    async markDone() {
      await load()
      await publish(dailyDone(known, utcDay(new Date())))
    },
  }
}
