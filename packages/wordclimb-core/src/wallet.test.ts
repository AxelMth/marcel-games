import { describe, expect, it } from "vitest"
import {
  HINT_COSTS,
  WEEKLY_COIN_ALLOWANCE,
  openWallet,
  rewardForStars,
  spendCoins,
} from "./wallet"

const at = (date: string) => new Date(`${date}T12:00:00Z`)

describe("openWallet", () => {
  it("gives a new player the weekly allowance", () => {
    expect(openWallet(null, at("2026-08-30"))).toEqual({
      balance: WEEKLY_COIN_ALLOWANCE,
      week: "2026-W35",
    })
  })

  it("leaves the balance alone within the same week", () => {
    const wallet = { balance: 3, week: "2026-W35" }

    expect(openWallet(wallet, at("2026-08-30"))).toBe(wallet)
  })

  it("tops a spent wallet back up when a new week starts", () => {
    const refilled = openWallet({ balance: 3, week: "2026-W35" }, at("2026-09-01"))

    expect(refilled).toEqual({ balance: WEEKLY_COIN_ALLOWANCE, week: "2026-W36" })
  })

  it("keeps earned coins above the allowance instead of resetting them", () => {
    const refilled = openWallet({ balance: 25, week: "2026-W35" }, at("2026-09-01"))

    expect(refilled.balance).toBe(25)
  })

  it("does not pile up allowances over several missed weeks", () => {
    const refilled = openWallet({ balance: 0, week: "2026-W30" }, at("2026-09-01"))

    expect(refilled.balance).toBe(WEEKLY_COIN_ALLOWANCE)
  })
})

describe("spendCoins", () => {
  it("takes the cost off the balance", () => {
    const wallet = { balance: 6, week: "2026-W35" }

    expect(spendCoins(wallet, HINT_COSTS.fullWord)?.balance).toBe(1)
  })

  it("refuses a cost the wallet cannot cover", () => {
    expect(spendCoins({ balance: 0, week: "2026-W35" }, HINT_COSTS.firstLetter)).toBeNull()
  })

  it("lets the last coin be spent", () => {
    expect(spendCoins({ balance: 1, week: "2026-W35" }, 1)?.balance).toBe(0)
  })
})

describe("rewardForStars", () => {
  it("pays one coin per star", () => {
    expect(rewardForStars({ balance: 2, week: "2026-W35" }, 3).balance).toBe(5)
  })
})
