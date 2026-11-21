import { describe, expect, it } from "vitest"
import { countries } from "./countries"
import type { GameConfig } from "./game-logic"
import { judgeGuess } from "./guess"

const byCode = (code: string) => countries.find((country) => country.code === code)!

const CONFIG: GameConfig = {
  mode: "world",
  level: 20,
  missingCountries: [byCode("FRA"), byCode("BRA")],
  allCountries: countries,
}

describe("judgeGuess", () => {
  it("accepts a missing country in either language, whatever the accents", () => {
    expect(judgeGuess("Brazil", CONFIG, []).outcome).toBe("correct")
    expect(judgeGuess("bresil", CONFIG, []).outcome).toBe("correct")
    expect(judgeGuess("  Brésil ", CONFIG, []).country?.code).toBe("BRA")
  })

  it("says so when the country was already found", () => {
    expect(judgeGuess("France", CONFIG, ["FRA"]).outcome).toBe("already-found")
  })

  it("tells a real country that is not asked for apart from a typo", () => {
    expect(judgeGuess("Italie", CONFIG, []).outcome).toBe("not-missing")
    expect(judgeGuess("Itlaie", CONFIG, [])).toEqual({ outcome: "invalid", country: null })
  })

  it("refuses an empty answer", () => {
    expect(judgeGuess("   ", CONFIG, []).outcome).toBe("invalid")
  })
})
