import {
  ApiHttpError,
  postFinishLevel,
  type BackendGameMode,
  type BackendLocale,
} from "./api"
import { confirmReportedSpend } from "./coins"

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
  /** Optional: results queued before coins existed carry no spend. */
  coinsSpent?: number
  savedAt: string
}

const STORAGE_KEY = "wordclimb-pending-results"
// Hard cap so a long offline streak can't grow the queue without bound.
const MAX_QUEUE_LENGTH = 50

/**
 * How many finished levels may pile up unsynced before the player is asked to
 * reconnect.
 *
 * Offline play is meant to cover a commute, not to become a second, divergent
 * save file. Every level banked offline is a level the server has not ranked,
 * and the longer that list grows the more there is to lose to a reinstall or a
 * cleared WKWebView store. Ten is roughly one sitting.
 */
export const MAX_OFFLINE_COMPLETIONS = 10

/**
 * Whether a new level may be started without the server having answered.
 *
 * Only classic play is gated. The daily is already limited to one a day by
 * isDailyCompleted(), so blocking it would take away the single puzzle an
 * offline player is entitled to.
 */
export function shouldBlockOfflineStart(
  mode: "classic" | "daily",
  pendingCount: number
): boolean {
  return mode === "classic" && pendingCount >= MAX_OFFLINE_COMPLETIONS
}

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

export type FlushOutcome = {
  /** Results the server accepted, and which are now gone from the queue. */
  sent: number
  /** Results the server refused outright; discarded rather than retried. */
  dropped: number
  /** Still queued — the network gave out partway through. */
  remaining: number
}

/**
 * One flush at a time.
 *
 * The queue is drained from several places now (launch, coming back online,
 * returning to the foreground, finishing a level). Two overlapping drains would
 * read the same head, post it twice, and race on the write-back.
 */
let isFlushing = false

/**
 * Replays queued results against the API, oldest first.
 * - Success → entry removed.
 * - Server rejection (HTTP error) → entry dropped: the server refused it and
 *   retrying the same payload would jam the queue forever.
 * - Network failure/timeout → entry kept, flush stops; retried on the next
 *   trigger.
 */
export async function flushPendingResults(
  userId: string
): Promise<FlushOutcome> {
  if (isFlushing) return { sent: 0, dropped: 0, remaining: pendingResultCount() }
  isFlushing = true

  let sent = 0
  let dropped = 0
  try {
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
          coinsSpent: head.coinsSpent ?? 0,
        })
        // Accepted, so the server's balance now accounts for this level's
        // hints and the local ledger can stop holding them back.
        confirmReportedSpend(head.coinsSpent ?? 0)
        sent++
        queue = rest
        writeQueue(queue)
      } catch (e) {
        if (e instanceof ApiHttpError) {
          // Dropping a result silently is how a player's evening of offline
          // play disappears with nothing to show for it. Still dropped — a
          // payload the server refuses would block every later result — but
          // said out loud, so it is visible in a bug report.
          console.warn(
            `[wordclimb] discarded a queued result the server refused ` +
              `(HTTP ${e.status}): ${head.beginWord}→${head.endWord}`
          )
          dropped++
          queue = rest
          writeQueue(queue)
          continue
        }
        // Network-level failure: still offline, try again on the next trigger.
        break
      }
    }
    return { sent, dropped, remaining: readQueue().length }
  } finally {
    isFlushing = false
  }
}
