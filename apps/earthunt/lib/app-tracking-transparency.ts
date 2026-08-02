import {
    AppTrackingTransparency,
    AppTrackingStatusResponse,
  } from 'capacitor-plugin-app-tracking-transparency';

export async function getStatus(): Promise<AppTrackingStatusResponse> {
    const response = await AppTrackingTransparency.getStatus();

    return response;
}

export async function requestPermission(): Promise<AppTrackingStatusResponse> {
    const response = await AppTrackingTransparency.requestPermission();

    return response;
}

/**
 * Shows the Google UMP (User Messaging Platform) consent form when required
 * (EEA/UK users). Without recorded consent, AdMob serves non-personalized ads
 * in Europe at a fraction of the revenue, and repeated policy violations can
 * get the account limited. Safe to call on every launch: the form is only
 * displayed when consent is REQUIRED and not yet obtained.
 */
async function gatherAdsConsent(): Promise<void> {
    try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;
        const { AdMob, AdmobConsentStatus } = await import('@capacitor-community/admob');
        const consentInfo = await AdMob.requestConsentInfo();
        if (
            consentInfo.isConsentFormAvailable &&
            consentInfo.status === AdmobConsentStatus.REQUIRED
        ) {
            await AdMob.showConsentForm();
        }
    } catch {
        // Consent gathering must never block the app; ads fall back to
        // non-personalized until the next attempt.
    }
}

/**
 * Asks the user for App Tracking Transparency permission if not yet determined,
 * then gathers UMP ads consent (order matters: ATT first so UMP can factor in
 * the tracking decision). Call this after the user has seen your app (e.g.
 * after splash) so the prompts feel contextual.
 * No-op on non-iOS or if status is already authorized/denied/restricted.
 */
export async function askForTrackingPermission(): Promise<AppTrackingStatusResponse | null> {
    let response: AppTrackingStatusResponse | null = null;
    try {
        response = await getStatus();
        if (response.status === 'notDetermined') {
            response = await requestPermission();
        }
    } catch {
        response = null;
    }
    await gatherAdsConsent();
    return response;
}