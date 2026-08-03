// AdMob identifiers are inlined at build time. Shipping Google's test units
// would mean an app full of ads that earn nothing; shipping EarthHunt's would
// be a policy violation. Neither failure is visible at runtime, so the build
// has to refuse.
//
// STORE_BUILD is set by the AppFlow native build (and can be set locally to
// rehearse it). A plain `next build` stays on the test units so day-to-day
// development needs no secrets.
if (process.env.STORE_BUILD === "1") {
  const required = [
    "NEXT_PUBLIC_ADMOB_IOS_APP_ID",
    "NEXT_PUBLIC_ADMOB_ANDROID_APP_ID",
    "NEXT_PUBLIC_ADMOB_IOS_INTERSTITIAL",
    "NEXT_PUBLIC_ADMOB_ANDROID_INTERSTITIAL",
    "NEXT_PUBLIC_ADMOB_IOS_REWARDED",
    "NEXT_PUBLIC_ADMOB_ANDROID_REWARDED",
  ]
  const missing = required.filter((name) => !process.env[name])
  if (missing.length > 0) {
    throw new Error(
      `Store build is missing WordClimb's AdMob identifiers: ${missing.join(", ")}.\n` +
        "Create them in the AdMob console (WordClimb needs its own app and units — " +
        "reusing EarthHunt's is a policy violation) and set them in the AppFlow " +
        "environment. The app ids must also be copied into ios/App/App/Info.plist " +
        "(GADApplicationIdentifier) and android/app/src/main/AndroidManifest.xml " +
        "(com.google.android.gms.ads.APPLICATION_ID), which is what the SDK reads " +
        "at launch."
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
