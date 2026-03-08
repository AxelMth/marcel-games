/**
 * Device info shape for the launch API payload (excluding deviceUUID, gameMode, continent).
 */

export type LaunchDeviceInfo = {
  brand: string | null
  osName: string | null
  osVersion: string | null
  modelName: string | null
  manufacturer: string | null
  deviceType: string
  isDevice: boolean
}

function deviceTypeFromInfo(model: string, platform: string): string {
  const m = model.toLowerCase()
  const p = platform.toLowerCase()
  if (p === "ios" && (m.includes("ipad") || m.includes("tablet"))) return "TABLET"
  if (p === "android" && (m.includes("tab") || m.includes("tablet"))) return "TABLET"
  if (p === "ios" || p === "android") return "PHONE"
  return "UNKNOWN"
}

/**
 * Returns device info for the launch API. On native uses Capacitor Device.getInfo();
 * on web uses navigator where available and UNKNOWN/null for the rest.
 */
export async function getLaunchDeviceInfo(): Promise<LaunchDeviceInfo> {
  if (typeof window === "undefined") {
    return {
      brand: null,
      osName: null,
      osVersion: null,
      modelName: null,
      manufacturer: null,
      deviceType: "UNKNOWN",
      isDevice: true,
    }
  }

  try {
    const { Capacitor } = await import("@capacitor/core").catch(() => ({ Capacitor: null }))
    const { Device } = await import("@capacitor/device").catch(() => ({ Device: null }))
    if (Capacitor?.isNativePlatform() && Device) {
      const info = await Device.getInfo()
      return {
        brand: info.manufacturer ?? null,
        osName: info.operatingSystem ?? null,
        osVersion: info.osVersion ?? null,
        modelName: info.model ?? null,
        manufacturer: info.manufacturer ?? null,
        deviceType: deviceTypeFromInfo(info.model ?? "", info.platform ?? ""),
        isDevice: !info.isVirtual,
      }
    }
  } catch {
    // fall through to web path
  }

  return {
    brand: typeof navigator !== "undefined" ? (navigator as { vendor?: string }).vendor ?? null : null,
    osName: typeof navigator !== "undefined" ? navigator.platform ?? null : null,
    osVersion: null,
    modelName: null,
    manufacturer: null,
    deviceType: "UNKNOWN",
    isDevice: true,
  }
}
