import { describe, expect, it, vi } from "vitest"
import { ApiHttpError } from "./http"
import { createGameSync, type KeyValueStore, type SyncOptions } from "./sync"

interface Result {
  level: number
}

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  const store: KeyValueStore = {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value)
    },
  }
  return { store, data }
}

function setup(overrides: Partial<SyncOptions<Result>> = {}, initial?: Record<string, string>) {
  const { store, data } = memoryStore(initial)
  const launch = vi.fn(async (deviceId: string) => `user-of-${deviceId}`)
  const send = vi.fn(async (_userId: string, _result: Result) => {})
  const sync = createGameSync<Result>({
    store,
    identityStore: store,
    namespace: "game",
    isResult: (value): value is Result =>
      typeof value === "object" && value !== null && "level" in value,
    newDeviceId: () => "device-1",
    launch,
    send,
    ...overrides,
  })
  return { sync, data, launch, send }
}

describe("createGameSync", () => {
  it("sends stored results oldest first under the id the launch answered", async () => {
    const { sync, send, data } = setup()
    await sync.record({ level: 1 })
    await sync.record({ level: 2 })

    await expect(sync.flush()).resolves.toBe("user-of-device-1")

    expect(send.mock.calls).toEqual([
      ["user-of-device-1", { level: 1 }],
      ["user-of-device-1", { level: 2 }],
    ])
    expect(data.get("game-pending-results")).toBe("[]")
  })

  it("keeps the same device id across sessions and launches once per session", async () => {
    const { sync, launch } = setup({}, { "game-device-id": "known-device" })
    await sync.flush()
    await sync.flush()
    expect(launch).toHaveBeenCalledTimes(1)
    expect(launch).toHaveBeenCalledWith("known-device")
  })

  it("keeps what could not be sent when the server is unreachable", async () => {
    const send = vi
      .fn<(userId: string, result: Result) => Promise<void>>()
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new TypeError("Network request failed"))
    const { sync, data } = setup({ send })
    await sync.record({ level: 1 })
    await sync.record({ level: 2 })

    vi.spyOn(console, "warn").mockImplementation(() => {})
    await expect(sync.flush()).resolves.toBe("user-of-device-1")

    expect(data.get("game-pending-results")).toBe('[{"level":2}]')
    await expect(sync.pendingCount()).resolves.toBe(1)
  })

  it("retries a server error but drops a result the server refuses", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})
    const send = vi
      .fn<(userId: string, result: Result) => Promise<void>>()
      .mockRejectedValueOnce(new ApiHttpError("bad payload", 400))
      .mockRejectedValueOnce(new ApiHttpError("down", 503))
    const { sync } = setup({ send })
    await sync.record({ level: 1 })
    await sync.record({ level: 2 })

    await sync.flush()
    expect(send).toHaveBeenCalledTimes(2)
    await expect(sync.pendingCount()).resolves.toBe(1)
  })

  it("launches again after a failed launch", async () => {
    const launch = vi
      .fn<(deviceId: string) => Promise<string>>()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce("user-1")
    const { sync } = setup({ launch })

    await expect(sync.flush()).rejects.toThrow("offline")
    await expect(sync.flush()).resolves.toBe("user-1")
  })

  it("starts an empty queue over stored results it cannot read", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const { sync, send, data } = setup({}, { "game-pending-results": '[{"level":' })
    await sync.record({ level: 3 })
    await sync.flush()
    expect(send.mock.calls).toEqual([["user-of-device-1", { level: 3 }]])
    expect(data.get("game-pending-results")).toBe("[]")
  })

  it("replays results stored by an earlier session", async () => {
    const { sync, send } = setup({}, { "game-pending-results": '[{"level":7},"junk"]' })
    await sync.flush()
    expect(send.mock.calls).toEqual([["user-of-device-1", { level: 7 }]])
  })
})
