import { describe, expect, it } from "vitest"
import { getStars } from "@/lib/stars"

describe("getStars", () => {
  it("gives three stars for a clean run with no hints", () => {
    expect(getStars(3, 3, 0)).toBe(3)
  })

  it("drops to two as soon as a hint is used, however accurate the run", () => {
    expect(getStars(3, 3, 1)).toBe(2)
  })

  it("gives two stars for a good run within the hint budget", () => {
    expect(getStars(4, 3, 2)).toBe(2)
  })

  it("gives one star past the hint budget", () => {
    expect(getStars(3, 3, 3)).toBe(1)
  })

  it("gives one star for a scattergun run", () => {
    expect(getStars(10, 3, 0)).toBe(1)
  })

  // The reason the server rounds instead of truncating: 16/23 is 69.56 %, which
  // integer division reads as 69 and scores one star where the rule says two.
  it("rounds accuracy rather than truncating it", () => {
    expect(getStars(23, 16, 0)).toBe(2)
  })

  // A level finished without a single guess — every word revealed by a hint —
  // must not divide by zero.
  it("treats a level with no attempts as perfect rather than dividing by zero", () => {
    expect(getStars(0, 3, 0)).toBe(3)
  })
})
