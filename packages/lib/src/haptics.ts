/**
 * Thin wrapper around @capacitor/haptics.
 * Safe to call in web environments — silently no-ops.
 */

export type HapticStyle = "light" | "medium" | "heavy";

export async function triggerHaptic(style: HapticStyle = "medium") {
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics").catch(
      () => ({ Haptics: null, ImpactStyle: null })
    );
    if (!Haptics || !ImpactStyle) return;

    const styleMap: Record<HapticStyle, string> = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: styleMap[style] as any });
  } catch {
    // Silently ignore on web / simulator
  }
}

export async function triggerNotificationHaptic(
  type: "success" | "warning" | "error" = "success"
) {
  try {
    const { Haptics, NotificationType } = await import(
      "@capacitor/haptics"
    ).catch(() => ({ Haptics: null, NotificationType: null }));
    if (!Haptics || !NotificationType) return;

    const typeMap = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    };
    await Haptics.notification({ type: typeMap[type] as any });
  } catch {
    // Silently ignore
  }
}
