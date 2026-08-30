import { beforeEach, describe, expect, it, vi } from "vitest"

// Declared through vi.hoisted so they exist by the time the hoisted vi.mock
// factory runs — a factory closing over ordinary top-level consts throws.
const { postFinishLevel, ApiHttpError } = vi.hoisted(() => {
  class ApiHttpError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  }
  return { postFinishLevel: vi.fn(), ApiHttpError }
})

vi.mock("./api", () => ({ postFinishLevel, ApiHttpError }))

// vi.mock is hoisted above this import, so pending-results resolves "./api" to
// the mock rather than the real client.
import {
  enqueuePendingResult,
  flushPendingResults,
  pendingResultCount,
  shouldBlockOfflineStart,
  MAX_OFFLINE_COMPLETIONS,
} from "./pending-results"

function aResult(attempts: number) {
  return {
    attempts,
    timeSpent: 30,
    hintsUsed: 0,
    gameMode: "NORMAL" as const,
    locale: "EN" as const,
    beginWord: "cold",
    endWord: "warm",
    wordLadder: ["cord", "card", "ward"],
  }
}

describe("pending results", () => {
  beforeEach(() => {
    window.localStorage.clear()
    postFinishLevel.mockReset()
  })

  it("keeps queued results across reads", () => {
    enqueuePendingResult(aResult(1))
    enqueuePendingResult(aResult(2))

    expect(pendingResultCount()).toBe(2)
  })

  it("replays results oldest first and empties the queue", async () => {
    postFinishLevel.mockResolvedValue({ nextLevel: 2 })
    enqueuePendingResult(aResult(1))
    enqueuePendingResult(aResult(2))

    await flushPendingResults("user-1")

    expect(postFinishLevel.mock.calls.map((c) => (c[0] as { attempts: number }).attempts))
      .toEqual([1, 2])
    expect(pendingResultCount()).toBe(0)
  })

  it("sends the whole puzzle, so the history can say which level it was", async () => {
    postFinishLevel.mockResolvedValue({ nextLevel: 2 })
    enqueuePendingResult(aResult(1))

    await flushPendingResults("user-1")

    expect(postFinishLevel).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        beginWord: "cold",
        endWord: "warm",
        wordLadder: ["cord", "card", "ward"],
        locale: "EN",
      })
    )
  })

  // Still offline: the result must survive for the next launch, and the flush
  // must stop rather than hammer a dead network for the whole queue.
  it("keeps results when the network fails", async () => {
    postFinishLevel.mockRejectedValue(new TypeError("Failed to fetch"))
    enqueuePendingResult(aResult(1))
    enqueuePendingResult(aResult(2))

    await flushPendingResults("user-1")

    expect(pendingResultCount()).toBe(2)
    expect(postFinishLevel).toHaveBeenCalledTimes(1)
  })

  // The server refused this payload; retrying it forever would block every
  // result queued behind it.
  it("drops a result the server rejected and carries on", async () => {
    postFinishLevel
      .mockRejectedValueOnce(new ApiHttpError("Finish level failed: 400", 400))
      .mockResolvedValueOnce({ nextLevel: 2 })
    enqueuePendingResult(aResult(1))
    enqueuePendingResult(aResult(2))

    await flushPendingResults("user-1")

    expect(pendingResultCount()).toBe(0)
    expect(postFinishLevel).toHaveBeenCalledTimes(2)
  })

  it("caps the queue so a long offline streak cannot grow it forever", () => {
    for (let i = 0; i < 60; i++) enqueuePendingResult(aResult(i))

    expect(pendingResultCount()).toBe(50)
  })

  it("survives corrupted storage rather than throwing", () => {
    window.localStorage.setItem("wordclimb-pending-results", "not json")

    expect(pendingResultCount()).toBe(0)
  })

  it("reports what it sent, dropped and could not send", async () => {
    postFinishLevel
      .mockResolvedValueOnce({ nextLevel: 2 })
      .mockRejectedValueOnce(new ApiHttpError("Finish level failed: 400", 400))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
    for (let i = 0; i < 3; i++) enqueuePendingResult(aResult(i))

    // The caller needs the counts to decide whether refreshing progress is
    // worth a round trip, and a silent drop is how an evening of offline play
    // disappears with nothing to show for it.
    const outcome = await flushPendingResults("user-1")

    expect(outcome).toEqual({ sent: 1, dropped: 1, remaining: 1 })
  })

  // Several triggers now drain the queue — launch, coming back online,
  // returning to the foreground, finishing a level — and they can fire
  // together. Two drains would read the same head and post it twice.
  it("runs one flush at a time", async () => {
    let release: () => void = () => {}
    const inFlight = new Promise<void>((resolve) => {
      release = resolve
    })
    postFinishLevel.mockImplementation(() => inFlight.then(() => ({ nextLevel: 2 })))
    enqueuePendingResult(aResult(1))

    const first = flushPendingResults("user-1")
    const second = await flushPendingResults("user-1")

    expect(second).toEqual({ sent: 0, dropped: 0, remaining: 1 })
    release()
    await first
    expect(postFinishLevel).toHaveBeenCalledTimes(1)
  })
})

describe("shouldBlockOfflineStart", () => {
  it("lets classic play continue below the limit", () => {
    expect(shouldBlockOfflineStart("classic", 0)).toBe(false)
    expect(shouldBlockOfflineStart("classic", MAX_OFFLINE_COMPLETIONS - 1)).toBe(
      false
    )
  })

  it("stops classic play once too much is waiting to sync", () => {
    expect(shouldBlockOfflineStart("classic", MAX_OFFLINE_COMPLETIONS)).toBe(true)
  })

  // The daily is already one a day; blocking it would take away the single
  // puzzle an offline player is entitled to.
  it("never blocks the daily challenge", () => {
    expect(shouldBlockOfflineStart("daily", MAX_OFFLINE_COMPLETIONS * 2)).toBe(
      false
    )
  })
})
