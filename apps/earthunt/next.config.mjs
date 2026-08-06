// NEXT_PUBLIC_* is inlined at build time. An empty Mapbox token produces a blank
// map with no error at runtime, which is indistinguishable from a broken app.
if (
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
) {
  throw new Error(
    "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is required for a production build. " +
      "Set it in .env.local locally, or in the Appflow environment for store builds."
  )
}

// An AdMob test device identifier is a 32-character hex MD5 of the advertising
// identifier, printed by the Google SDK on its first ad request. It is easily
// confused with the device UDID Xcode shows (00008110-0012652E2299801E), which
// AdMob simply does not recognise — so the device keeps asking for live ads,
// gets no fill, and nothing appears. Since a wrong value fails silently at
// runtime, reject it here instead.
const adMobTestDevices = (process.env.NEXT_PUBLIC_ADMOB_TEST_DEVICE_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean)

const malformedTestDevices = adMobTestDevices.filter(
  (id) => !/^[0-9a-fA-F]{32}$/.test(id)
)

if (malformedTestDevices.length > 0) {
  throw new Error(
    `NEXT_PUBLIC_ADMOB_TEST_DEVICE_IDS holds ${malformedTestDevices.length} value(s) ` +
      `that are not AdMob test device identifiers: ${malformedTestDevices.join(", ")}.\n` +
      "Expected 32 hex characters with no dashes, e.g. 2077ef9a63d2b398840261c8221a0c9b.\n" +
      "This is NOT the UDID Xcode shows under Devices and Simulators. The Google " +
      "Mobile Ads SDK prints the right value to the device log on its first ad " +
      'request: <Google> To get test ads on this device, set ... @"THE-ID".'
  )
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export required for Capacitor to embed the web assets
  output: "export",
  // Disable image optimisation for static export
  images: {
    unoptimized: true,
  },
  // Transpile shared workspace packages
  transpilePackages: ["@marcel-games/ui", "@marcel-games/lib"],
};

export default nextConfig;
