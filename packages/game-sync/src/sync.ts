import { ApiHttpError } from "./http"

export interface KeyValueStore {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
}

// A long offline streak must not grow the queue without bound.
const MAX_QUEUED_RESULTS = 50

// A result the server keeps failing on would otherwise block every later one.
const MAX_SERVER_FAILURES = 5

export interface SyncOptions<Result> {
  /** Holds the queue of results. */
  store: KeyValueStore
  /**
   * Holds the device id. Kept apart from `store` so it can live somewhere that
   * outlasts an uninstall: the id is what ties a reinstalled game to its levels.
   */
  identityStore: KeyValueStore
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
   * Sends the stored results, oldest first, and answers the player's id. A
   * result that could not be sent stays stored and ends the pass, unless the
   * server has failed on it too many times. Rejects only
   * when the player could not be identified.
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

function isServerFailure(error: unknown): boolean {
  return error instanceof ApiHttpError && error.status >= 500
}

/**
 * Keeps finished levels on the device until the server has them.
 *
 * Results carry no player id: the server numbers a level from the player's own
 * history, so replaying the queue in order rebuilds the right progression for
 * whichever id the device is given.
 */
export function createGameSync<Result>(options: SyncOptions<Result>): GameSync<Result> {
  const { store, identityStore, namespace, isResult, newDeviceId, launch, send } = options
  const queueKey = `${namespace}-pending-results`
  const deviceKey = `${namespace}-device-id`
  const failuresKey = `${namespace}-head-failures`

  let queue: Promise<Result[]> | null = null
  let userId: Promise<string> | null = null
  let flushing: Promise<string> | null = null

  // A queue that cannot be parsed is given up: keeping it would make every
  // later read fail too, and no finished level would ever be stored again.
  const parseQueue = (stored: string): Result[] => {
    try {
      const data: unknown = JSON.parse(stored)
      if (Array.isArray(data)) return data.filter(isResult)
      console.error("Stored results are not a list, starting an empty queue", stored)
    } catch (error) {
      console.error("Stored results cannot be read, starting an empty queue", error)
    }
    return []
  }

  const readQueue = async (): Promise<Result[]> => {
    const stored = await store.getItem(queueKey)
    return stored === null ? [] : parseQueue(stored)
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
    const stored = await identityStore.getItem(deviceKey)
    if (stored) return stored
    const created = newDeviceId()
    await identityStore.setItem(deviceKey, created)
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

  /** Counts server failures on the oldest result, across sessions; answers the new count. */
  const countServerFailure = async (): Promise<number> => {
    const stored = Number(await store.getItem(failuresKey))
    const count = (Number.isInteger(stored) && stored > 0 ? stored : 0) + 1
    await store.setItem(failuresKey, String(count))
    return count
  }

  const sendAll = async (): Promise<string> => {
    const id = await signIn()
    const results = await loadQueue()
    while (results.length > 0) {
      const next = results[0]
      try {
        await send(id, next)
      } catch (error) {
        const givenUp =
          isRefused(error) ||
          (isServerFailure(error) && (await countServerFailure()) >= MAX_SERVER_FAILURES)
        if (!givenUp) {
          console.warn("A finished level could not be sent, it stays stored", error)
          return id
        }
        console.error("The server cannot take a finished level, dropping it", error)
      }
      await store.setItem(failuresKey, "0")
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
