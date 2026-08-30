// Shared storage layer (Capacitor Preferences / localStorage / in-memory)
export { storage } from "./storage"

// Shared hooks
export { useDeviceUUID, type DurableIdStore } from "./use-device-uuid"
export { getLaunchDeviceInfo, type LaunchDeviceInfo } from "./get-launch-device-info"
export { useAnimatedText } from "./use-animated-text"
export { useKeyboardOffset } from "./use-keyboard-offset"

// Shared utilities
export { getLanguage, type Language } from "./language"
export {
  triggerHaptic,
  triggerNotificationHaptic,
  type HapticStyle,
} from "./haptics"
