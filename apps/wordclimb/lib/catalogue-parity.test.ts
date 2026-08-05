import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { CATALOGUE, type Level } from "@/lib/data/catalogue"

/**
 * The offline fallback only works because both catalogues are the same
 * catalogue.
 *
 * When the API is unreachable the app plays level N out of its bundled
 * catalogue, and the server hands out level N out of the one in Postgres. If
 * the two ever drift, a player's progression means a different puzzle depending
 * on whether they had network — and the level of the day, which both sides
 * derive by hashing the date modulo the catalogue size, stops agreeing
 * entirely.
 *
 * scripts/build-catalogue.mjs writes both files in a single run. This test is
 * what catches one of them being regenerated without the other.
 */
const SERVER_CATALOGUE_PATH = join(
  __dirname,
  "..",
  "..",
  "..",
  "server",
  "wordclimb",
  "internal",
  "constants",
  "catalogue.json"
)

const serverCatalogue: Record<string, Level[]> = JSON.parse(
  readFileSync(SERVER_CATALOGUE_PATH, "utf-8")
)

describe("client and server catalogues", () => {
  it("cover the same locales", () => {
    expect(Object.keys(serverCatalogue).sort()).toEqual(
      Object.keys(CATALOGUE).sort()
    )
  })

  for (const locale of ["en", "fr"] as const) {
    describe(locale, () => {
      it("has the same number of levels on both sides", () => {
        // The daily puzzle is `hash(date) % catalogue.length` on both sides:
        // a different length alone is enough to pick a different puzzle.
        expect(serverCatalogue[locale]).toHaveLength(CATALOGUE[locale].length)
      })

      it("has the same levels in the same order", () => {
        expect(serverCatalogue[locale]).toEqual(CATALOGUE[locale])
      })
    })
  }
})
