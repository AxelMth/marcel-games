// AdMob identifiers are no longer environment-driven: WordClimb's own app and
// unit ids live in lib/ad-constants.ts, and lib/ad-native-config.test.ts asserts
// they stay in step with Info.plist, AndroidManifest.xml and capacitor.config.
//
// That test is the guard now, and it is the right shape for this failure: a
// native key drifting out of sync aborts the app at launch, and nothing at
// runtime notices. It is how EarthHunt got rejected under guideline 2.1.

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
}

export default nextConfig
