import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  ADMOB_APP_IDS,
  ADMOB_INTERSTITIAL_AD_IDS,
  ADMOB_REWARDED_AD_IDS,
} from "./ad-constants"

/**
 * The AdMob app id lives in four places: this app's constants, capacitor.config,
 * Info.plist and AndroidManifest.xml. Only the last two are read by the native
 * SDK at launch, and a missing or mismatched value aborts the process before a
 * single frame renders.
 *
 * That is not hypothetical: it is exactly why EarthHunt was rejected under
 * guideline 2.1. Nothing at runtime notices the drift, so a test has to.
 */
const APP_DIR = join(__dirname, "..")

function read(relativePath: string): string {
  return readFileSync(join(APP_DIR, relativePath), "utf-8")
}

/** Google's public test app id — fine in development, never in a store build. */
const TEST_APP_ID = "ca-app-pub-3940256099942544~1458002511"
const TEST_PUBLISHER = "ca-app-pub-3940256099942544"
/** EarthHunt's own registration. Serving its ads here would be a policy breach. */
const EARTHUNT_APP_IDS = [
  "ca-app-pub-6271901101573718~5878435021",
  "ca-app-pub-6271901101573718~9313598215",
]

describe("AdMob app id is consistent across every file that carries it", () => {
  it("matches between the constants and Info.plist", () => {
    const plist = read("ios/App/App/Info.plist")
    const match = plist.match(
      /<key>GADApplicationIdentifier<\/key>\s*<string>([^<]+)<\/string>/
    )
    expect(match, "GADApplicationIdentifier is absent from Info.plist").not.toBeNull()
    expect(match![1].trim()).toBe(ADMOB_APP_IDS.ios)
  })

  it("matches between the constants and AndroidManifest.xml", () => {
    const manifest = read("android/app/src/main/AndroidManifest.xml")
    const match = manifest.match(
      /com\.google\.android\.gms\.ads\.APPLICATION_ID"\s*\n?\s*android:value="([^"]+)"/
    )
    expect(match, "APPLICATION_ID is absent from AndroidManifest.xml").not.toBeNull()
    expect(match![1].trim()).toBe(ADMOB_APP_IDS.android)
  })

  it("matches between the constants and capacitor.config.ts", () => {
    const config = read("capacitor.config.ts")
    expect(config).toContain(ADMOB_APP_IDS.ios)
    expect(config).toContain(ADMOB_APP_IDS.android)
  })
})

describe("AdMob identifiers are WordClimb's own", () => {
  it("does not ship Google's test app id", () => {
    for (const id of Object.values(ADMOB_APP_IDS)) {
      expect(id).not.toBe(TEST_APP_ID)
      expect(id.startsWith(TEST_PUBLISHER)).toBe(false)
    }
  })

  it("does not reuse EarthHunt's app registration", () => {
    // Serving one app's ads from another can get the whole AdMob account
    // limited, and it corrupts EarthHunt's metrics.
    for (const id of Object.values(ADMOB_APP_IDS)) {
      expect(EARTHUNT_APP_IDS).not.toContain(id)
    }
  })

  it("uses the tilde form for app ids and the slash form for units", () => {
    // Swapping the two is easy and silent: an ad unit id in Info.plist fails
    // to initialise just like a missing one.
    for (const id of Object.values(ADMOB_APP_IDS)) {
      expect(id, `${id} should be an app id`).toMatch(/^ca-app-pub-\d+~\d+$/)
    }
    for (const id of [
      ...Object.values(ADMOB_INTERSTITIAL_AD_IDS),
      ...Object.values(ADMOB_REWARDED_AD_IDS),
    ]) {
      expect(id, `${id} should be an ad unit id`).toMatch(/^ca-app-pub-\d+\/\d+$/)
    }
  })
})
