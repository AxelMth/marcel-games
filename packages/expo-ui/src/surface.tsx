import type { ReactNode } from "react"
import {
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native"
// The gesture-handler Pressable, not React Native's: the built-in one hands the
// touch to a single view at a time, so a second key pressed before the first
// thumb lifts is dropped — which is how people type.
import { Pressable } from "react-native-gesture-handler"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

const BORDER_WIDTH = 1.5

interface SurfaceProps {
  face: string
  /** Hairline around the face, for surfaces that sit on a ground of nearly the same colour. */
  border?: string
  radius: number
  height: number
  style?: StyleProp<ViewStyle>
  children?: ReactNode
}

function faceStyle({ face, border, radius, height }: SurfaceProps): ViewStyle {
  return {
    height,
    borderRadius: radius,
    backgroundColor: face,
    borderWidth: border ? BORDER_WIDTH : 0,
    borderColor: border,
  }
}

/** The flat panel every tile, key and button is drawn on. */
export function Surface(props: SurfaceProps) {
  return <View style={[styles.face, faceStyle(props), props.style]}>{props.children}</View>
}

const ACTIVATE = [{ name: "activate" }] as const

interface PressableSurfaceProps extends SurfaceProps {
  onPress: () => void
  accessibilityLabel: string
  disabled?: boolean
  /** Fire on touch-down rather than on release, as a keyboard key does. */
  immediate?: boolean
  /** Layout of the pressable itself (flex, width); `style` lays out its content. */
  outerStyle?: StyleProp<ViewStyle>
}

/** A Surface that dims and shrinks slightly while it is held down. */
export function PressableSurface({
  onPress,
  accessibilityLabel,
  disabled = false,
  immediate = false,
  outerStyle,
  ...surface
}: PressableSurfaceProps) {
  const pressed = useSharedValue(0)
  const feedback = useAnimatedStyle(() => ({
    opacity: 1 - pressed.get() * 0.3,
    transform: [{ scale: 1 - pressed.get() * 0.04 }],
  }))

  const handlePressIn = () => {
    pressed.set(withTiming(1, { duration: 50 }))
    if (immediate) onPress()
  }
  // VoiceOver activates an element without a touch-down, so an immediate key
  // needs the activation spelled out or it could never be pressed.
  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === "activate") onPress()
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      accessibilityActions={immediate ? ACTIVATE : undefined}
      onAccessibilityAction={immediate ? handleAccessibilityAction : undefined}
      disabled={disabled}
      onPress={immediate ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={() => pressed.set(withTiming(0, { duration: 120 }))}
      style={outerStyle}
    >
      <Animated.View style={[styles.face, faceStyle(surface), surface.style, feedback]}>
        {surface.children}
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  face: { alignItems: "center", justifyContent: "center" },
})
