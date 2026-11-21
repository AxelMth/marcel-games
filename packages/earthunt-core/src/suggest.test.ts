import { describe, expect, it } from "vitest"
import { countries, getFlagEmoji } from "./countries"
import { suggestCountries } from "./game-logic"

const codes = (input: string, found: string[] = [], locale: "en" | "fr" = "fr") =>
  suggestCountries(input, countries, found, locale).map((country) => country.code)

describe("suggestCountries", () => {
  it("waits for two letters", () => {
    expect(codes("b")).toEqual([])
    expect(codes("  ")).toEqual([])
  })

  it("matches the start of any word, ignoring accents and case", () => {
    expect(codes("bre")).toContain("BRA")
    expect(codes("EMI")).toContain("ARE")
    expect(codes("arabes")).toContain("ARE")
  })

  it("matches aliases", () => {
    expect(codes("holl")).toEqual(["NLD"])
  })

  it("never offers a country already found", () => {
    expect(codes("fran", ["FRA"])).not.toContain("FRA")
  })

  it("returns at most four, names starting with the input first", () => {
    const result = suggestCountries("gu", countries, [], "fr")
    expect(result).toHaveLength(4)
    expect(result.every((c) => c.nameFr.toLowerCase().startsWith("gu"))).toBe(true)
  })
})

describe("getFlagEmoji", () => {
  it("builds the flag from the alpha-2 code", () => {
    const france = countries.find((country) => country.code === "FRA")!
    expect(getFlagEmoji(france)).toBe("\u{1F1EB}\u{1F1F7}")
  })
})
