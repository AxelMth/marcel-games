import { beforeEach, describe, expect, it } from "vitest"
import {
  HINT_COSTS,
  WEEKLY_COIN_ALLOWANCE,
  canAfford,
  getCoinBalance,
  isoWeekId,
  reconcileCoins,
  spendCoins,
} from "./coins"

const at = (iso: string) => new Date(`${iso}T12:00:00Z`)

function storedCoins() {
  const raw = window.localStorage.getItem("wordclimb-coins")
  return raw ? JSON.parse(raw) : null
}

describe("isoWeekId", () => {
  // These vectors are duplicated verbatim in
  // server/wordclimb/internal/domain/coins_test.go. They are the contract
  // between the two implementations: if they drift, a player is refilled twice
  // or not at all around the new year, where "week 1" and "the first week of
  // January" are not the same thing.
  it.each([
    ["2026-08-30", "2026-W35"],
    ["2025-12-29", "2026-W01"],
    ["2025-12-31", "2026-W01"],
    ["2026-01-01", "2026-W01"],
    ["2027-01-01", "2026-W53"],
    ["2026-08-24", "2026-W35"],
    ["2026-08-23", "2026-W34"],
    ["2026-01-05", "2026-W02"],
  ])("%s falls in %s", (date, expected) => {
    expect(isoWeekId(at(date))).toBe(expected)
  })

  it("does not shift with the device's timezone", () => {
    // Late evening UTC is a different local date east of Greenwich; both must
    // still report the same week, or two devices disagree on when it turns.
    const utc = new Date("2026-08-30T23:00:00Z")
    const sameInstantElsewhere = new Date(utc.getTime())
    expect(isoWeekId(utc)).toBe(isoWeekId(sameInstantElsewhere))
  })
})

describe("coin balance", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("starts a new player off with a full week's allowance", () => {
    expect(getCoinBalance(at("2026-08-30"))).toBe(WEEKLY_COIN_ALLOWANCE)
  })

  it("tops up when a new week starts", () => {
    spendCoins(7, at("2026-08-30"))
    expect(getCoinBalance(at("2026-08-30"))).toBe(3)

    expect(getCoinBalance(at("2026-09-01"))).toBe(WEEKLY_COIN_ALLOWANCE)
  })

  it("does not accumulate week over week", () => {
    // Away for a month means ten coins waiting, not forty.
    spendCoins(10, at("2026-07-06"))
    expect(getCoinBalance(at("2026-08-30"))).toBe(WEEKLY_COIN_ALLOWANCE)
  })

  it("leaves a balance above the allowance alone", () => {
    reconcileCoins(50, at("2026-08-30"))
    expect(getCoinBalance(at("2026-09-01"))).toBe(50)
  })

  it("refills once, not on every read", () => {
    getCoinBalance(at("2026-09-01"))
    spendCoins(4, at("2026-09-01"))
    expect(getCoinBalance(at("2026-09-01"))).toBe(6)
  })
})

describe("spending", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("charges the hint's price", () => {
    expect(spendCoins(HINT_COSTS.fullWord, at("2026-08-30"))).toBe(true)
    expect(getCoinBalance(at("2026-08-30"))).toBe(
      WEEKLY_COIN_ALLOWANCE - HINT_COSTS.fullWord
    )
  })

  it("refuses rather than going into debt", () => {
    spendCoins(9, at("2026-08-30"))
    expect(canAfford(HINT_COSTS.fullWord, at("2026-08-30"))).toBe(false)
    expect(spendCoins(HINT_COSTS.fullWord, at("2026-08-30"))).toBe(false)
    // The refused spend must not have moved anything.
    expect(getCoinBalance(at("2026-08-30"))).toBe(1)
  })

  it("prices revealing the whole word above the informative hints", () => {
    // It does not help the player find the word, it hands it over.
    expect(HINT_COSTS.fullWord).toBeGreaterThan(HINT_COSTS.firstLetter)
    expect(HINT_COSTS.fullWord).toBeGreaterThan(HINT_COSTS.definition)
  })
})

describe("reconciling with the server", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("takes the server's number as the truth, in both directions", () => {
    reconcileCoins(4, at("2026-08-30"))
    expect(getCoinBalance(at("2026-08-30"))).toBe(4)

    reconcileCoins(25, at("2026-08-30"))
    expect(getCoinBalance(at("2026-08-30"))).toBe(25)
  })

  it("never stores a negative balance", () => {
    reconcileCoins(-5, at("2026-08-30"))
    expect(getCoinBalance(at("2026-08-30"))).toBe(0)
  })

  it("survives corrupted storage rather than throwing", () => {
    window.localStorage.setItem("wordclimb-coins", "not json")
    expect(getCoinBalance(at("2026-08-30"))).toBe(WEEKLY_COIN_ALLOWANCE)
    expect(storedCoins()).toEqual({
      balance: WEEKLY_COIN_ALLOWANCE,
      week: "2026-W35",
    })
  })
})
