import { describe, expect, it } from "vitest"
import { AD_REWARD_COINS, rewardForAd, spendCoins } from "./wallet"

describe("rewardForAd", () => {
  it("adds the ad reward and keeps the week", () => {
    expect(rewardForAd({ balance: 0, week: "2026-W48" })).toEqual({
      balance: AD_REWARD_COINS,
      week: "2026-W48",
    })
  })

  it("pays for the dearest hint of either game", () => {
    expect(spendCoins(rewardForAd({ balance: 0, week: "2026-W48" }), 5)).not.toBeNull()
  })
})
