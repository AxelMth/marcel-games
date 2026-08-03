import { afterEach, describe, expect, it, vi } from "vitest"
import {
  ApiHttpError,
  getLevel,
  getProfile,
  getProgress,
  postFinishLevel,
  postLaunch,
} from "./api"

function jsonOk(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

/** A fetch that never settles unless its AbortSignal fires. */
function hangingFetch() {
  return vi.fn(
    (_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () =>
          reject(new DOMException("The operation was aborted.", "AbortError"))
        )
      })
  )
}

describe("api client", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe("timeouts", () => {
    // A sleeping Fly machine accepts the connection and never answers. Without a
    // timeout the caller's spinner runs forever, which reads as a frozen app.
    it.each([
      ["getProgress", () => getProgress("u1")],
      ["getLevel", () => getLevel({ userId: "u1", gameMode: "WORLD" })],
      [
        "postLaunch",
        () => postLaunch({ deviceUUID: "d1", deviceType: "phone", gameMode: "WORLD", continent: "" }),
      ],
      [
        "postFinishLevel",
        () =>
          postFinishLevel({
            userId: "u1",
            attempts: 1,
            timeSpent: 1,
            hintsUsed: 0,
            gameMode: "WORLD",
            continent: "WORLD",
            countryCodes: ["FRA"],
          }),
      ],
      ["getProfile", () => getProfile("u1")],
    ])("%s gives up instead of hanging forever", async (_name, call) => {
      vi.useFakeTimers()
      vi.stubGlobal("fetch", hangingFetch())

      const pending = call()
      const assertion = expect(pending).rejects.toThrow()

      // Well past the longest configured timeout.
      await vi.advanceTimersByTimeAsync(15_000)
      await assertion
    })

    it("passes an abort signal to every request", async () => {
      vi.useFakeTimers()
      const fetchMock = hangingFetch()
      vi.stubGlobal("fetch", fetchMock)

      const pending = getProfile("u1")
      const assertion = expect(pending).rejects.toThrow()
      await vi.advanceTimersByTimeAsync(15_000)
      await assertion

      const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
      expect(init.signal).toBeInstanceOf(AbortSignal)
    })
  })

  describe("error typing", () => {
    // flushPendingResults distinguishes "the server refused this" (drop the
    // entry) from "the network is down" (keep it). That only works if every
    // endpoint reports HTTP failures as ApiHttpError.
    it.each([
      ["getProgress", () => getProgress("u1")],
      ["getLevel", () => getLevel({ userId: "u1", gameMode: "WORLD" })],
      [
        "postLaunch",
        () => postLaunch({ deviceUUID: "d1", deviceType: "phone", gameMode: "WORLD", continent: "" }),
      ],
      ["getProfile", () => getProfile("u1")],
    ])("%s throws ApiHttpError carrying the status", async (_name, call) => {
      vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 503 })))

      await expect(call()).rejects.toBeInstanceOf(ApiHttpError)
      await expect(call()).rejects.toMatchObject({ status: 503 })
    })
  })

  describe("happy path", () => {
    it("returns the parsed profile", async () => {
      const profile = {
        gameHistory: [],
        stats: { dailyLevelsCompleted: 3, lastLevelRank: 2, globalRank: 9 },
      }
      vi.stubGlobal("fetch", vi.fn(async () => jsonOk(profile)))

      await expect(getProfile("u1")).resolves.toEqual(profile)
    })

    it("sends the userId as a query parameter", async () => {
      const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
        jsonOk({ gameHistory: [], stats: {} })
      )
      vi.stubGlobal("fetch", fetchMock)

      await getProfile("user-42")

      const [url] = fetchMock.mock.calls[0]
      expect(String(url)).toContain("userId=user-42")
    })
  })
})
