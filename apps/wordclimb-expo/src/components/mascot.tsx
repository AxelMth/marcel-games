import { useEffect } from "react"
import { StyleSheet, View } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import { colors } from "@/theme/tokens"

export const MASCOT_WIDTH = 48
export const MASCOT_HEIGHT = 52

interface MascotProps {
  /** Bump this to make the mascot jump; it stays put while it is 0. */
  hopKey?: number
}

/** The yellow tile with eyes that climbs the ladder alongside the player. */
export function Mascot({ hopKey = 0 }: MascotProps) {
  const bob = useSharedValue(0)
  const hop = useSharedValue(0)
  const tilt = useSharedValue(0)
  const eyelid = useSharedValue(1)

  useEffect(() => {
    const sway = { duration: 1200, easing: Easing.inOut(Easing.quad) }
    bob.set(withRepeat(withSequence(withTiming(-3, sway), withTiming(0, sway)), -1))
    eyelid.set(
      withRepeat(
        withSequence(
          withDelay(3600, withTiming(0.1, { duration: 90 })),
          withTiming(1, { duration: 90 })
        ),
        -1
      )
    )
  }, [bob, eyelid])

  useEffect(() => {
    if (hopKey === 0) return
    hop.set(
      withSequence(
        withTiming(-22, { duration: 220, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 9, stiffness: 220 })
      )
    )
    tilt.set(
      withSequence(
        withTiming(-10, { duration: 220 }),
        withTiming(4, { duration: 200 }),
        withTiming(0, { duration: 160 })
      )
    )
  }, [hop, hopKey, tilt])

  const body = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.get() + hop.get() }, { rotate: `${tilt.get()}deg` }],
  }))
  const blink = useAnimatedStyle(() => ({ transform: [{ scaleY: eyelid.get() }] }))

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.box, body]}
    >
      <View style={styles.lip} />
      <View style={styles.face} />
      <Animated.View style={[styles.eye, styles.leftEye, blink]}>
        <View style={styles.pupil} />
      </Animated.View>
      <Animated.View style={[styles.eye, styles.rightEye, blink]}>
        <View style={styles.pupil} />
      </Animated.View>
      <View style={styles.smile} />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  box: { width: MASCOT_WIDTH, height: MASCOT_HEIGHT },
  lip: {
    position: "absolute",
    left: 3,
    top: 8,
    width: 42,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.accentLip,
  },
  face: {
    position: "absolute",
    left: 3,
    top: 4,
    width: 42,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.accent,
  },
  eye: {
    position: "absolute",
    top: 15,
    width: 10,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  leftEye: { left: 12 },
  rightEye: { left: 26 },
  pupil: {
    position: "absolute",
    left: 3.4,
    top: 4.4,
    width: 5.2,
    height: 5.2,
    borderRadius: 2.6,
    backgroundColor: colors.ink,
  },
  smile: {
    position: "absolute",
    left: 18,
    top: 30,
    width: 12,
    height: 7,
    borderBottomWidth: 2.6,
    borderLeftWidth: 2.6,
    borderRightWidth: 2.6,
    borderColor: colors.ink,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
})
