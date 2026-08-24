/** Countries the player has already named. */
export const COUNTRY_GREEN = "#6d9581"

/** The country a paid "show on map" hint is pointing at. */
export const COUNTRY_HIGHLIGHT_COLOR = "#FFD700"

/**
 * A Mapbox `case` expression giving every country its fill colour.
 *
 * One expression rather than a stack of layers, on purpose. The map used to
 * carry three unfiltered fill layers over the same source, and the last one
 * added — solid green, never updated afterwards — sat on top of the highlight
 * layer and painted over it. The hinted country was therefore never yellow, no
 * matter how correctly the highlight itself was computed. A single expression
 * cannot have an ordering bug: the branches are evaluated in the order written.
 *
 * Priority is highlight first, then found, then the rest.
 */
export function buildCountryFillExpression(
  highlightedCode: string | null,
  foundCodes: string[]
): unknown[] {
  return [
    "case",
    // A bare `false`, not `["literal", false]`: Mapbox's `literal` takes an
    // array or an object, so the boolean form is an invalid expression. It is
    // rejected as a whole, silently — setPaintProperty fires an error event and
    // keeps the previous value — which left every country on the layer's
    // constant green and no country ever turned gold.
    highlightedCode ? ["==", ["get", "ADM0_A3"], highlightedCode] : false,
    COUNTRY_HIGHLIGHT_COLOR,
    ["in", ["get", "ADM0_A3"], ["literal", foundCodes]],
    COUNTRY_GREEN,
    COUNTRY_GREEN,
  ]
}

/**
 * Evaluates {@link buildCountryFillExpression} for one country.
 *
 * Mapbox does the real evaluation on the GPU, which no test can reach, so this
 * mirrors the same branch order for the properties the expression reads.
 */
export function resolveCountryFill(
  expression: unknown[],
  countryCode: string
): string {
  const [, highlightCondition, highlightColour, foundCondition, foundColour, fallback] =
    expression as [
      string,
      unknown[] | false,
      string,
      unknown[],
      string,
      string,
    ]

  // The condition is a bare `false` when no hint is active, and a comparison
  // otherwise — see buildCountryFillExpression on why it is not ["literal", false].
  if (Array.isArray(highlightCondition)) {
    const [highlightOp, , highlightValue] = highlightCondition as [string, unknown, string]
    if (highlightOp === "==" && highlightValue === countryCode) return highlightColour
  }

  const foundList = (foundCondition as [string, unknown, ["literal", string[]]])[2]?.[1] ?? []
  if (foundList.includes(countryCode)) return foundColour

  return fallback
}
