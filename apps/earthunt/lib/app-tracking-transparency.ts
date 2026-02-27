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