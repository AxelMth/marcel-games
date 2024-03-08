import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';

let isMobileAdsStartCalled = false;

export async function requestAdConsentAndStartMobileAdsSDK() {
  const showConsentFormPromise = AdsConsent.requestInfoUpdate().then(() =>
    AdsConsent.loadAndShowConsentFormIfRequired().then(
      ({ canRequestAds }) => canRequestAds
    )
  );

  const canUserRequestAds = AdsConsent.getConsentInfo().then(
    ({ canRequestAds }) => canRequestAds
  );

  const canRequestAds = await Promise.all([
    showConsentFormPromise,
    canUserRequestAds,
  ]);

  if (canRequestAds) {
    await startGoogleMobileAdsSDK();
  }

  // TODO: Handle the case where the user can't request ads
}

async function startGoogleMobileAdsSDK() {
  if (isMobileAdsStartCalled) return;

  isMobileAdsStartCalled = true;

  // Initialize the Google Mobile Ads SDK.
  await mobileAds().initialize();
}
