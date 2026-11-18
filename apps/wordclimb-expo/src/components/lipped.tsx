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
import { LIP } from "@/theme/tokens"

interface LippedProps {
  face: string
  lip: string
  radius: number
  /** Height of the face alone; the lip is added underneath. */
  height: number
  depth?: number
  style?: StyleProp<ViewStyle>
  faceStyle?: StyleProp<ViewStyle>
  children?: ReactNode
}

/** A surface with a darker band under it, the shape every tile, key and button shares. */
export function Lipped({
  face,
  lip,
  radius,
  height,
  depth = LIP,
  style,
  faceStyle,
  children,
}: LippedProps) {
  return (
    <View style={[{ height: height + depth }, style]}>
      <View style={[styles.lip, { top: depth, borderRadius: radius, backgroundColor: lip }]} />
      <View
        style={[styles.face, { height, borderRadius: radius, backgroundColor: face }, faceStyle]}
      >
        {children}
      </View>
    </View>
  )
}

const ACTIVATE = [{ name: "activate" }] as const

interface PressableLipProps extends LippedProps {
  onPress: () => void
  accessibilityLabel: string
  disabled?: boolean
  /** Fire on touch-down rather than on release, as a keyboard key does. */
  immediate?: boolean
}

/** A Lipped surface whose face sinks onto its lip while it is held down. */
export function PressableLip({
  onPress,
  accessibilityLabel,
  disabled = false,
  immediate = false,
  face,
  lip,
  radius,
  height,
  depth = LIP,
  style,
  faceStyle,
  children,
}: PressableLipProps) {
  const pressed = useSharedValue(0)
  const sink = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.get() * depth }],
  }))

  const handlePressIn = () => {
    pressed.set(withTiming(1, { duration: 60 }))
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
      onPressOut={() => pressed.set(withTiming(0, { duration: 110 }))}
      style={[{ height: height + depth }, style]}
    >
      <View style={[styles.lip, { top: depth, borderRadius: radius, backgroundColor: lip }]} />
      <Animated.View
        style={[
          styles.face,
          { height, borderRadius: radius, backgroundColor: face },
          faceStyle,
          sink,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  lip: { position: "absolute", left: 0, right: 0, bottom: 0 },
  face: { alignItems: "center", justifyContent: "center" },
})
