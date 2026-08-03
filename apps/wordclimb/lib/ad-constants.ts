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

/** Google's public test units — never earn revenue, always safe to request. */
const TEST_APP_ID = "ca-app-pub-3940256099942544~1458002511"
const TEST_INTERSTITIAL_AD_IDS = {
  ios: "ca-app-pub-3940256099942544/4411468910",
  android: "ca-app-pub-3940256099942544/1033173712",
} as const
const TEST_REWARDED_AD_IDS = {
  ios: "ca-app-pub-3940256099942544/1712485313",
  android: "ca-app-pub-3940256099942544/5224354917",
} as const

/**
 * Set these from the AdMob console once WordClimb iOS and Android are
 * registered. The app id (tilde) also has to be copied into
 * ios/App/App/Info.plist as GADApplicationIdentifier and into
 * android/app/src/main/AndroidManifest.xml as
 * com.google.android.gms.ads.APPLICATION_ID — a missing native key crashes the
 * app at launch, which is exactly what got EarthHunt rejected.
 */
export const ADMOB_APP_IDS = {
  ios: process.env.NEXT_PUBLIC_ADMOB_IOS_APP_ID || TEST_APP_ID,
  android: process.env.NEXT_PUBLIC_ADMOB_ANDROID_APP_ID || TEST_APP_ID,
} as const

export const ADMOB_INTERSTITIAL_AD_IDS = IS_PROD
  ? ({
      ios:
        process.env.NEXT_PUBLIC_ADMOB_IOS_INTERSTITIAL ||
        TEST_INTERSTITIAL_AD_IDS.ios,
      android:
        process.env.NEXT_PUBLIC_ADMOB_ANDROID_INTERSTITIAL ||
        TEST_INTERSTITIAL_AD_IDS.android,
    } as const)
  : TEST_INTERSTITIAL_AD_IDS

export const ADMOB_REWARDED_AD_IDS = IS_PROD
  ? ({
      ios:
        process.env.NEXT_PUBLIC_ADMOB_IOS_REWARDED || TEST_REWARDED_AD_IDS.ios,
      android:
        process.env.NEXT_PUBLIC_ADMOB_ANDROID_REWARDED ||
        TEST_REWARDED_AD_IDS.android,
    } as const)
  : TEST_REWARDED_AD_IDS

/** True when the build is still on Google's test identifiers. */
export const USING_TEST_AD_IDS = ADMOB_APP_IDS.ios === TEST_APP_ID

/**
 * Levels between two interstitials. Same value as EarthHunt: frequent enough to
 * matter, rare enough not to read as an ad wall.
 */
export const NUMBER_OF_LEVELS_BETWEEN_ADS = 5
