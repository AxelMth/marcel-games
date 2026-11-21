import { useEffect } from "react"
import { StyleSheet, Text } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"
import { Surface } from "@marcel-games/expo-ui"
import { colors, fonts } from "@marcel-games/expo-ui"

export type TileKind = "given" | "found" | "empty" | "filled" | "caret" | "error" | "hidden"

/** Delay between two letters of a solved word lifting, so the word ripples left to right. */
export const LETTER_STAGGER_MS = 60

interface Skin {
  face: string
  text: string
  border?: string
}

const SKINS: Record<TileKind, Skin> = {
  given: { face: colors.ink, text: colors.surface },
  found: { face: colors.found, text: colors.surface },
  empty: { face: colors.surface, text: colors.ink, border: colors.line },
  filled: { face: colors.surface, text: colors.ink, border: colors.lineStrong },
  caret: { face: colors.surface, text: colors.ink, border: colors.ink },
  error: { face: colors.surface, text: colors.danger, border: colors.danger },
  hidden: { face: colors.hidden, text: colors.hidden },
}

interface TileProps {
  kind: TileKind
  char: string
  size: number
  /** Position in the word, which staggers the celebration. */
  index: number
  /** True while the word this tile belongs to has just been solved. */
  celebrate: boolean
}

export function Tile({ kind, char, size, index, celebrate }: TileProps) {
  const scale = useSharedValue(1)
  const lift = useSharedValue(0)
  const glow = useSharedValue(1)

  useEffect(() => {
    if (celebrate) {
      const step = { duration: 160, easing: Easing.out(Easing.quad) }
      lift.set(
        withDelay(index * LETTER_STAGGER_MS, withSequence(withTiming(-6, step), withTiming(0, step)))
      )
      return
    }
    if (kind === "caret") {
      const beat = { duration: 600, easing: Easing.inOut(Easing.quad) }
      glow.set(withRepeat(withSequence(withTiming(0.55, beat), withTiming(1, beat)), -1))
      return
    }
    glow.set(withTiming(1, { duration: 100 }))
    lift.set(withTiming(0, { duration: 100 }))
    if (kind === "filled") {
      scale.set(withSequence(withTiming(0.92, { duration: 0 }), withTiming(1, { duration: 140 })))
    }
  }, [celebrate, glow, index, kind, lift, scale])

  const motion = useAnimatedStyle(() => ({
    opacity: glow.get(),
    transform: [{ translateY: lift.get() }, { scale: scale.get() }],
  }))

  const skin = SKINS[kind]
  return (
    <Animated.View style={[{ width: size }, motion]}>
      <Surface face={skin.face} border={skin.border} radius={Math.round(size * 0.18)} height={size}>
        <Text style={[styles.letter, { fontSize: Math.round(size * 0.5), color: skin.text }]}>
          {char.toUpperCase()}
        </Text>
      </Surface>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  // Stretched and centred rather than sized to the glyph: iOS measures a lone
  // "I" narrower than it draws it, and then renders nothing at all.
  letter: {
    alignSelf: "stretch",
    textAlign: "center",
    fontFamily: fonts.display,
    includeFontPadding: false,
  },
})
