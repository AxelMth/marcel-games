"use client"

import { AdMobInit as SharedAdMobInit } from "@marcel-games/lib"

/**
 * Devices to serve test ads to, from the app's own environment.
 *
 * Read here rather than in the shared package: NEXT_PUBLIC_* is inlined by
 * Next at build time, which only works from inside the app, and the package is
 * consumed by an app that does not define this variable at all.
 *
 * Empty in a normal build — see .env.example for why you would set it.
 */
const TEST_DEVICE_IDS = (process.env.NEXT_PUBLIC_ADMOB_TEST_DEVICE_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean)

export function AdMobInit() {
  return <SharedAdMobInit testDeviceIds={TEST_DEVICE_IDS} />
}
