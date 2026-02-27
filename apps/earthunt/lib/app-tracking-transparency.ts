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
 * Asks the user for App Tracking Transparency permission if not yet determined.
 * Call this after the user has seen your app (e.g. after splash) so the prompt feels contextual.
 * No-op on non-iOS or if status is already authorized/denied/restricted.
 */
export async function askForTrackingPermission(): Promise<AppTrackingStatusResponse | null> {
    try {
        const response = await getStatus();
        if (response.status === 'notDetermined') {
            return await requestPermission();
        }
        return response;
    } catch {
        return null;
    }
}