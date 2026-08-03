/**
 * AdMob identifiers for WordClimb.
 *
 * WordClimb needs its OWN AdMob app and ad units. Reusing EarthHunt's is an
 * AdMob policy violation — serving one app's ads in another can get the whole
 * account limited — and it would pollute EarthHunt's metrics.
 *
 * Until those are created, everything below falls back to Google's public test
 * identifiers, which serve real-looking ads that earn nothing and are safe to
 * request from a simulator. The production build guard in next.config.mjs
 * refuses to build with the placeholders still in place, so this cannot ship
 * by accident.
 *
 * https://developers.google.com/admob/ios/test-ads
 */

const IS_PROD = process.env.NODE_ENV === "production"

/**
 * Google's public test units — never earn revenue, always safe to request from
 * a simulator. Requesting live ads from a test device is a policy violation.
 */
const TEST_INTERSTITIAL_AD_IDS = {
  ios: "ca-app-pub-3940256099942544/4411468910",
  android: "ca-app-pub-3940256099942544/1033173712",
} as const
const TEST_REWARDED_AD_IDS = {
  ios: "ca-app-pub-3940256099942544/1712485313",
  android: "ca-app-pub-3940256099942544/5224354917",
} as const

/**
 * WordClimb's own AdMob app registrations.
 *
 * These same values MUST also appear in ios/App/App/Info.plist as
 * GADApplicationIdentifier and in android/app/src/main/AndroidManifest.xml as
 * com.google.android.gms.ads.APPLICATION_ID — those native keys are what the
 * SDK reads at launch, and a missing or mismatched one aborts the process.
 * lib/ad-native-config.test.ts asserts the three stay in step.
 */
export const ADMOB_APP_IDS = {
  ios: "ca-app-pub-6271901101573718~8478860820",
  android: "ca-app-pub-6271901101573718~9736102177",
} as const

/** WordClimb's own units — "palier 5 niveaux" in the AdMob console. */
export const ADMOB_INTERSTITIAL_AD_IDS = IS_PROD
  ? ({
      ios: "ca-app-pub-6271901101573718/1798149826",
      android: "ca-app-pub-6271901101573718/4424313161",
    } as const)
  : TEST_INTERSTITIAL_AD_IDS

/** WordClimb's own units — the ones that pay for a hint. */
export const ADMOB_REWARDED_AD_IDS = IS_PROD
  ? ({
      ios: "ca-app-pub-6271901101573718/5313054703",
      android: "ca-app-pub-6271901101573718/1913452475",
    } as const)
  : TEST_REWARDED_AD_IDS

/**
 * Levels between two interstitials. Same value as EarthHunt: frequent enough to
 * matter, rare enough not to read as an ad wall.
 */
export const NUMBER_OF_LEVELS_BETWEEN_ADS = 5
