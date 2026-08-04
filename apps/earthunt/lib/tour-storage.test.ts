import { describe, it, expect, vi, afterEach } from "vitest"

import { hasSeenTour, markTourSeen, resetTour, TOUR_VERSIONS } from "./tour-storage"

describe("tour storage", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("reports a tour as unseen until it is marked", () => {
    expect(hasSeenTour("game")).toBe(false)
    markTourSeen("game")
    expect(hasSeenTour("game")).toBe(true)
  })

  it("keeps the two tours independent", () => {
    markTourSeen("home")

    expect(hasSeenTour("home")).toBe(true)
    expect(hasSeenTour("game")).toBe(false)
  })

  it("replays a tour after a reset, and only that one", () => {
    markTourSeen("home")
    markTourSeen("game")

    resetTour("game")

    expect(hasSeenTour("game")).toBe(false)
    expect(hasSeenTour("home")).toBe(true)
  })

  // The whole point of versioning: a redesigned tour has to reach players who
  // already saw the previous one.
  it("shows a tour again once its version is bumped", () => {
    markTourSeen("game")
    expect(hasSeenTour("game")).toBe(true)

    const original = TOUR_VERSIONS.game
    TOUR_VERSIONS.game = original + 1
    try {
      expect(hasSeenTour("game")).toBe(false)
    } finally {
      TOUR_VERSIONS.game = original
    }
  })

  // Safari in private mode throws on write. Replaying the tour on every launch
  // would be far more annoying than never showing it.
  it("treats an unreadable storage as already seen", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError")
    })

    expect(hasSeenTour("game")).toBe(true)
  })

  it("does not throw when storage refuses a write", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError")
    })

    expect(() => markTourSeen("game")).not.toThrow()
  })
})
