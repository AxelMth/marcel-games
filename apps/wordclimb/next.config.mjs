// AdMob identifiers are inlined at build time. Shipping Google's test units
// would mean an app full of ads that earn nothing; shipping EarthHunt's would
// be a policy violation. Neither failure is visible at runtime, so the build
// has to refuse.
//
// STORE_BUILD is set by the AppFlow native build (and can be set locally to
// rehearse it). A plain `next build` stays on the test units so day-to-day
// development needs no secrets.
if (process.env.STORE_BUILD === "1") {
  // The ad UNIT ids (slash form) are now hardcoded in lib/ad-constants.ts.
  // Only the APP ids (tilde form) are still missing: they are what the native
  // SDK reads at launch, and a wrong or absent one aborts the process.
  const required = [
    "NEXT_PUBLIC_ADMOB_IOS_APP_ID",
    "NEXT_PUBLIC_ADMOB_ANDROID_APP_ID",
  ]
  const missing = required.filter((name) => !process.env[name])
  if (missing.length > 0) {
    throw new Error(
      `Store build is missing WordClimb's AdMob APP ids: ${missing.join(", ")}.\n` +
        "These are the tilde-form ids (ca-app-pub-XXXX~NNNN) shown on the app's " +
        "page in the AdMob console — not the slash-form ad unit ids, which are " +
        "already wired. WordClimb needs its OWN app registration; EarthHunt's " +
        "would be a policy violation.\n" +
        "Once created, set them here AND copy them into ios/App/App/Info.plist " +
        "(GADApplicationIdentifier) and android/app/src/main/AndroidManifest.xml " +
        "(com.google.android.gms.ads.APPLICATION_ID) — those native keys are what " +
        "the SDK reads at launch, and a missing one crashes the app."
    )
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
}

export default nextConfig
