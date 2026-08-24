import { describe, it, expect } from "vitest"

import {
  buildCountryFillExpression,
  COUNTRY_GREEN,
  COUNTRY_HIGHLIGHT_COLOR,
  resolveCountryFill,
} from "./map-paint"

/**
 * The reported bug: a paid "show on map" hint never turned the country yellow.
 *
 * The highlight was computed correctly all along — but the map carried three
 * unfiltered fill layers over one source, and the last one added painted every
 * country solid green and was never updated afterwards, so it covered the gold
 * for good. These lock the single expression that replaced the stack.
 */
describe("country fill", () => {
  it("paints the hinted country gold", () => {
    const expression = buildCountryFillExpression("FRA", [])

    expect(resolveCountryFill(expression, "FRA")).toBe(COUNTRY_HIGHLIGHT_COLOR)
  })

  it("paints found countries green", () => {
    const expression = buildCountryFillExpression(null, ["ESP", "ITA"])

    expect(resolveCountryFill(expression, "ESP")).toBe(COUNTRY_GREEN)
    expect(resolveCountryFill(expression, "ITA")).toBe(COUNTRY_GREEN)
  })

  // The precise shape of the old bug: green winning over gold.
  it("lets the hint win over the found colour", () => {
    const expression = buildCountryFillExpression("FRA", ["FRA", "ESP"])

    expect(resolveCountryFill(expression, "FRA")).toBe(COUNTRY_HIGHLIGHT_COLOR)
    expect(resolveCountryFill(expression, "ESP")).toBe(COUNTRY_GREEN)
  })

  it("gives every other country the default colour", () => {
    const expression = buildCountryFillExpression("FRA", ["ESP"])

    expect(resolveCountryFill(expression, "DEU")).toBe(COUNTRY_GREEN)
  })

  it("highlights nothing when no hint has been paid for", () => {
    const expression = buildCountryFillExpression(null, ["ESP"])

    for (const code of ["FRA", "ESP", "DEU"]) {
      expect(resolveCountryFill(expression, code)).toBe(COUNTRY_GREEN)
    }
  })

  /**
   * `["literal", false]` is not a valid Mapbox expression — `literal` takes an
   * array or an object — and an invalid branch invalidates the whole thing.
   * setPaintProperty then keeps the previous value without throwing, so every
   * country stayed on the layer's constant green and the hint never showed.
   * Nothing in the app surfaced it; only running it on a device did.
   */
  it("uses a bare boolean for the no-highlight branch", () => {
    const expression = buildCountryFillExpression(null, [])

    expect(expression[1]).toBe(false)
    expect(JSON.stringify(expression)).not.toContain('["literal",false]')
  })

  // Guards the shape Mapbox needs: a flat "case" with condition/value pairs and
  // a single trailing fallback.
  it("produces a well-formed case expression", () => {
    const expression = buildCountryFillExpression("FRA", ["ESP"])

    expect(expression[0]).toBe("case")
    expect(expression.length % 2).toBe(0)
    expect(expression.at(-1)).toBe(COUNTRY_GREEN)
  })
})
