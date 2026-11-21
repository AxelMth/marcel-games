import * as Haptics from "expo-haptics"
import { Platform } from "react-native"

let warned = false

function report(error: unknown): void {
  if (warned) return
  warned = true
  console.warn("Haptics unavailable on this device", error)
}

function run(trigger: () => Promise<void>): void {
  // The web build has no haptic engine; calling it would only reject.
  if (Platform.OS === "web") return
  trigger().catch(report)
}

export function hapticKey(): void {
  run(() => Haptics.selectionAsync())
}

export function hapticSuccess(): void {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success))
}

export function hapticError(): void {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error))
}
