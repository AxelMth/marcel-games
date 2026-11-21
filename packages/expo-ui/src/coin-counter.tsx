import { useEffect, useRef, type ComponentRef, type Ref } from "react"
import { StyleSheet, Text, View } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated"
import { GoldCoin } from "./icons"
import { fonts, MIN_TOUCH } from "./tokens"

interface CoinCounterProps {
  /** The balance to show, or null while the wallet has not been read. */
  value: number | null
  accessibilityLabel: string
  ref?: Ref<ComponentRef<typeof View>>
}

/** The coin balance as a gold pill. It jumps each time the balance goes up, so a reward is seen landing. */
export function CoinCounter({ value, accessibilityLabel, ref }: CoinCounterProps) {
  const scale = useSharedValue(1)
  const previous = useRef(value)

  useEffect(() => {
    const before = previous.current
    previous.current = value
    if (value === null || before === null || value <= before) return
    const step = { duration: 110, easing: Easing.out(Easing.quad) }
    scale.set(withSequence(withTiming(1.3, step), withTiming(1, step)))
  }, [scale, value])

  const bump = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }))

  return (
    <View
      ref={ref}
      collapsable={false}
      accessible
      accessibilityLabel={accessibilityLabel}
      style={styles.hit}
    >
      <Animated.View style={[styles.pill, bump]}>
        <GoldCoin size={20} />
        <Text style={styles.label}>{value ?? "–"}</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  hit: { minWidth: MIN_TOUCH, height: MIN_TOUCH, alignItems: "flex-end", justifyContent: "center" },
  pill: {
    height: 34,
    paddingLeft: 6,
    paddingRight: 12,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF1CC",
  },
  label: { fontFamily: fonts.bodyBold, fontSize: 16, color: "#7A4F00" },
})
