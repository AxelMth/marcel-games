import { beforeEach, describe, expect, it } from "vitest"
import { getProgressCache, setProgressCache } from "./progress-cache"
import type { ProgressResponse } from "./api"

const PROGRESS: ProgressResponse = {
  worldLevel: 42,
  randomLevel: 7,
  dailyCompleted: true,
}

describe("progress cache", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("has nothing to offer before the server has ever answered", () => {
    expect(getProgressCache()).toBeNull()
  })

  it("gives back the last progression the server confirmed", () => {
    setProgressCache(PROGRESS)

    expect(getProgressCache()).toEqual(PROGRESS)
  })

  it("does not keep stats, which age badly", () => {
    setProgressCache({
      ...PROGRESS,
      stats: { dailyLevelsCompleted: 3, lastLevelRank: 1, globalRank: 2 },
    })

    expect(getProgressCache()).not.toHaveProperty("stats")
  })

  // This is storage some other version of the app wrote. A half-read object
  // would render as NaN on the home screen.
  it("refuses a malformed cache rather than handing back junk", () => {
    window.localStorage.setItem("wordclimb-progress-cache", "not json")
    expect(getProgressCache()).toBeNull()

    window.localStorage.setItem(
      "wordclimb-progress-cache",
      JSON.stringify({ worldLevel: "many", randomLevel: 1, dailyCompleted: false })
    )
    expect(getProgressCache()).toBeNull()
  })
})
