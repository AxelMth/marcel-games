import { beforeEach, describe, expect, it, vi } from "vitest"
import { enqueuePendingResult, flushPendingResults } from "./pending-results"

const STORAGE_KEY = "earthunt-pending-results"

function makeResult(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    attempts: 5,
    timeSpent: 42,
    hintsUsed: 0,
    gameMode: "WORLD" as const,
    continent: "WORLD" as const,
    countryCodes: ["FRA"],
    ...overrides,
  }
}

function readQueue(): Array<Record<string, unknown>> {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : []
}

function okResponse() {
  return new Response(JSON.stringify({ nextLevel: 2, nextCountryCodes: ["ITA"] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

describe("pending results queue", () => {
  describe("enqueue", () => {
    it("stores a result with a timestamp", () => {
      enqueuePendingResult(makeResult())
      const queue = readQueue()
      expect(queue).toHaveLength(1)
      expect(queue[0]).toMatchObject({ attempts: 5, gameMode: "WORLD" })
      expect(typeof queue[0].savedAt).toBe("string")
    })

    it("preserves order, oldest first", () => {
      enqueuePendingResult(makeResult({ attempts: 1 }))
      enqueuePendingResult(makeResult({ attempts: 2 }))
      enqueuePendingResult(makeResult({ attempts: 3 }))
      expect(readQueue().map((r) => r.attempts)).toEqual([1, 2, 3])
    })

    it("caps the queue at 50, dropping the oldest", () => {
      for (let i = 0; i < 55; i++) {
        enqueuePendingResult(makeResult({ attempts: i }))
      }
      const queue = readQueue()
      expect(queue).toHaveLength(50)
      // The five oldest were dropped, so it starts at 5 and ends at 54.
      expect(queue[0].attempts).toBe(5)
      expect(queue[49].attempts).toBe(54)
    })

    it("recovers from a corrupt queue instead of throwing", () => {
      window.localStorage.setItem(STORAGE_KEY, "{not json")
      expect(() => enqueuePendingResult(makeResult())).not.toThrow()
      expect(readQueue()).toHaveLength(1)
    })

    it("ignores a non-array payload", () => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ nope: true }))
      enqueuePendingResult(makeResult())
      expect(readQueue()).toHaveLength(1)
    })
  })

  describe("flush", () => {
    beforeEach(() => {
      enqueuePendingResult(makeResult({ attempts: 1 }))
      enqueuePendingResult(makeResult({ attempts: 2 }))
    })

    it("posts every entry and empties the queue on success", async () => {
      const fetchMock = vi.fn(async () => okResponse())
      vi.stubGlobal("fetch", fetchMock)

      await flushPendingResults("user-1")

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(readQueue()).toHaveLength(0)
    })

    it("replays oldest first and attaches the userId", async () => {
      const bodies: unknown[] = []
      vi.stubGlobal(
        "fetch",
        vi.fn(async (_url: unknown, init: RequestInit) => {
          bodies.push(JSON.parse(String(init.body)))
          return okResponse()
        })
      )

      await flushPendingResults("user-1")

      expect(bodies).toMatchObject([
        { attempts: 1, userId: "user-1" },
        { attempts: 2, userId: "user-1" },
      ])
    })

    it("drops an entry the server rejects, so it cannot jam the queue", async () => {
      // A 400 means the server refused this payload; retrying it forever would
      // block every later result behind it.
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response("bad", { status: 400 }))
        .mockResolvedValueOnce(okResponse())
      vi.stubGlobal("fetch", fetchMock)

      await flushPendingResults("user-1")

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(readQueue()).toHaveLength(0)
    })

    it("keeps the entry and stops on a network failure", async () => {
      const fetchMock = vi.fn(async () => {
        throw new TypeError("Failed to fetch")
      })
      vi.stubGlobal("fetch", fetchMock)

      await flushPendingResults("user-1")

      // Stopped at the first entry rather than burning through the whole queue.
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(readQueue()).toHaveLength(2)
    })

    it("resumes where it stopped on the next launch", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          throw new TypeError("Failed to fetch")
        })
      )
      await flushPendingResults("user-1")
      expect(readQueue()).toHaveLength(2)

      vi.stubGlobal("fetch", vi.fn(async () => okResponse()))
      await flushPendingResults("user-1")
      expect(readQueue()).toHaveLength(0)
    })

    it("stops after the first network failure even if earlier entries succeeded", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(okResponse())
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      vi.stubGlobal("fetch", fetchMock)

      await flushPendingResults("user-1")

      // First entry posted and removed; second kept for the next attempt.
      const queue = readQueue()
      expect(queue).toHaveLength(1)
      expect(queue[0].attempts).toBe(2)
    })

    it("is a no-op on an empty queue", async () => {
      window.localStorage.removeItem(STORAGE_KEY)
      const fetchMock = vi.fn(async () => okResponse())
      vi.stubGlobal("fetch", fetchMock)

      await flushPendingResults("user-1")

      expect(fetchMock).not.toHaveBeenCalled()
    })
  })
})
