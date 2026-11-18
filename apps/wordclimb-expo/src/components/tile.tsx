import { useEffect } from "react"
import { StyleSheet, Text, View } from "react-native"
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
import { Lipped } from "@/components/lipped"
import { colors, fonts, LIP } from "@/theme/tokens"

export type TileKind = "given" | "found" | "empty" | "filled" | "caret" | "error" | "hidden"

/** Delay between two letters of a solved word jumping, so the word ripples left to right. */
export const LETTER_STAGGER_MS = 70

const POP_SPRING = { damping: 9, stiffness: 240 }
const TAP_SPRING = { damping: 11, stiffness: 320 }
const RING_WIDTH = 3

interface Skin {
  face: string
  lip: string
  text: string
  ring?: string
}

const PLAIN: Skin = { face: colors.surface, lip: colors.surfaceLip, text: colors.ink }

const SKINS: Record<Exclude<TileKind, "hidden">, Skin> = {
  given: { face: colors.ink, lip: colors.inkLip, text: colors.surface },
  found: { face: colors.found, lip: colors.foundLip, text: colors.surface },
  empty: PLAIN,
  filled: PLAIN,
  caret: { ...PLAIN, ring: colors.accent },
  error: { ...PLAIN, text: colors.danger, ring: colors.danger },
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

  useEffect(() => {
    if (celebrate) {
      const delay = index * LETTER_STAGGER_MS
      const rise = { duration: 160, easing: Easing.out(Easing.quad) }
      lift.set(withDelay(delay, withSequence(withTiming(-12, rise), withSpring(0, POP_SPRING))))
      scale.set(withDelay(delay, withSequence(withTiming(1.12, rise), withSpring(1, POP_SPRING))))
      return
    }
    if (kind === "caret") {
      const beat = { duration: 600, easing: Easing.inOut(Easing.quad) }
      scale.set(withRepeat(withSequence(withTiming(1.05, beat), withTiming(1, beat)), -1))
      return
    }
    if (kind === "filled") {
      scale.set(withSequence(withTiming(0.8, { duration: 0 }), withSpring(1, TAP_SPRING)))
      return
    }
    scale.set(withTiming(1, { duration: 120 }))
    lift.set(withTiming(0, { duration: 120 }))
  }, [celebrate, index, kind, lift, scale])

  const motion = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.get() }, { scale: scale.get() }],
  }))
  const radius = Math.round(size * 0.28)

  if (kind === "hidden") {
    return (
      <View style={{ width: size, height: size + LIP }}>
        <View style={[styles.hidden, { height: size, borderRadius: radius }]} />
      </View>
    )
  }

  const skin = SKINS[kind]
  return (
    <Animated.View style={[{ width: size }, motion]}>
      <Lipped
        face={skin.face}
        lip={skin.lip}
        radius={radius}
        height={size}
        faceStyle={skin.ring ? { borderWidth: RING_WIDTH, borderColor: skin.ring } : undefined}
      >
        <Text style={[styles.letter, { fontSize: Math.round(size * 0.54), color: skin.text }]}>
          {char.toUpperCase()}
        </Text>
      </Lipped>
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
  hidden: {
    backgroundColor: colors.hiddenFill,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.hiddenBorder,
  },
})
