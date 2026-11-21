import { ApiHttpError } from "./http"

export interface KeyValueStore {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
}

// A long offline streak must not grow the queue without bound.
const MAX_QUEUED_RESULTS = 50

export interface SyncOptions<Result> {
  store: KeyValueStore
  /** Prefix of the storage keys, one per game. */
  namespace: string
  isResult: (value: unknown) => value is Result
  newDeviceId: () => string
  /** Registers the device and answers the server's id for its player. */
  launch: (deviceId: string) => Promise<string>
  send: (userId: string, result: Result) => Promise<void>
}

export interface GameSync<Result> {
  /** Stores a finished level so it survives until the server has it. */
  record: (result: Result) => Promise<void>
  /**
   * Sends every stored result, oldest first, and answers the player's id.
   * Rejects when the server cannot be reached; what was not sent stays stored.
   */
  flush: () => Promise<string>
  pendingCount: () => Promise<number>
}

/** A result the server refuses will be refused again: retrying it would block the queue for good. */
function isRefused(error: unknown): boolean {
  return (
    error instanceof ApiHttpError &&
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== 408 &&
    error.status !== 429
  )
}

/**
 * Keeps finished levels on the device until the server has them.
 *
 * Results carry no player id: the server numbers a level from the player's own
 * history, so replaying the queue in order rebuilds the right progression for
 * whichever id the device is given.
 */
export function createGameSync<Result>(options: SyncOptions<Result>): GameSync<Result> {
  const { store, namespace, isResult, newDeviceId, launch, send } = options
  const queueKey = `${namespace}-pending-results`
  const deviceKey = `${namespace}-device-id`

  let queue: Promise<Result[]> | null = null
  let userId: Promise<string> | null = null
  let flushing: Promise<string> | null = null

  const readQueue = async (): Promise<Result[]> => {
    const stored = await store.getItem(queueKey)
    if (stored === null) return []
    const data: unknown = JSON.parse(stored)
    if (!Array.isArray(data)) throw new Error(`Stored results are not a list: ${stored}`)
    return data.filter(isResult)
  }

  const loadQueue = (): Promise<Result[]> => {
    queue ??= readQueue().catch((error: unknown) => {
      queue = null
      throw error
    })
    return queue
  }

  const saveQueue = (results: Result[]): Promise<void> =>
    store.setItem(queueKey, JSON.stringify(results))

  const deviceId = async (): Promise<string> => {
    const stored = await store.getItem(deviceKey)
    if (stored) return stored
    const created = newDeviceId()
    await store.setItem(deviceKey, created)
    return created
  }

  const signIn = (): Promise<string> => {
    userId ??= deviceId()
      .then(launch)
      .catch((error: unknown) => {
        userId = null
        throw error
      })
    return userId
  }

  const sendAll = async (): Promise<string> => {
    const id = await signIn()
    const results = await loadQueue()
    while (results.length > 0) {
      const next = results[0]
      try {
        await send(id, next)
      } catch (error) {
        if (!isRefused(error)) throw error
        console.error("The server refused a finished level, dropping it", error)
      }
      // By identity, not by position: a level finished during the request may
      // have pushed this one out of a full queue already.
      const position = results.indexOf(next)
      if (position >= 0) results.splice(position, 1)
      await saveQueue(results)
    }
    return id
  }

  return {
    async record(result) {
      const results = await loadQueue()
      results.push(result)
      if (results.length > MAX_QUEUED_RESULTS) results.shift()
      await saveQueue(results)
    },
    flush() {
      flushing ??= sendAll().finally(() => {
        flushing = null
      })
      return flushing
    },
    async pendingCount() {
      return (await loadQueue()).length
    },
  }
}
