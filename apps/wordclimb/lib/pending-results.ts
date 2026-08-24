import {
  ApiHttpError,
  postFinishLevel,
  type BackendGameMode,
  type BackendLocale,
} from "./api"

/**
 * Offline queue for finished-level results.
 *
 * When a level is completed while the API is unreachable (airplane mode,
 * restricted network, cold-starting server), the result is stored here and
 * replayed on the next successful launch. Entries carry no userId: the server
 * derives the level number from the user's own history, so replaying in order
 * reconstructs the correct progression for whatever userId the flush uses.
 */
export type PendingResult = {
  attempts: number
  timeSpent: number
  hintsUsed: number
  gameMode: BackendGameMode
  locale: BackendLocale
  beginWord: string
  endWord: string
  wordLadder: string[]
  savedAt: string
}

const STORAGE_KEY = "wordclimb-pending-results"
// Hard cap so a long offline streak can't grow the queue without bound.
const MAX_QUEUE_LENGTH = 50

function readQueue(): PendingResult[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueue(queue: PendingResult[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {
    // Storage full or unavailable — losing queued results is acceptable,
    // blocking gameplay is not.
  }
}

export function enqueuePendingResult(result: Omit<PendingResult, "savedAt">) {
  const queue = readQueue()
  queue.push({ ...result, savedAt: new Date().toISOString() })
  writeQueue(queue.slice(-MAX_QUEUE_LENGTH))
}

export function pendingResultCount(): number {
  return readQueue().length
}

/**
 * Replays queued results against the API, oldest first.
 * - Success → entry removed.
 * - Server rejection (HTTP error) → entry dropped: the server refused it and
 *   retrying the same payload would jam the queue forever.
 * - Network failure/timeout → entry kept, flush stops; retried next launch.
 */
export async function flushPendingResults(userId: string): Promise<void> {
  let queue = readQueue()
  while (queue.length > 0) {
    const [head, ...rest] = queue
    try {
      await postFinishLevel({
        userId,
        attempts: head.attempts,
        timeSpent: head.timeSpent,
        hintsUsed: head.hintsUsed,
        gameMode: head.gameMode,
        locale: head.locale,
        beginWord: head.beginWord,
        endWord: head.endWord,
        wordLadder: head.wordLadder,
      })
      queue = rest
      writeQueue(queue)
    } catch (e) {
      if (e instanceof ApiHttpError) {
        queue = rest
        writeQueue(queue)
        continue
      }
      // Network-level failure: still offline, try again next launch.
      break
    }
  }
}
