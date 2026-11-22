import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react"
import { StyleSheet, Text, useWindowDimensions, View } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import { hapticKey, hapticSuccess } from "./haptics"
import { GoldCoin, StarIcon } from "./icons"
import { PressableSurface } from "./surface"
import { fonts } from "./tokens"

export interface Point {
  x: number
  y: number
}

interface LevelCompleteProps {
  /** Background of the screen: the game's own colour. */
  accent: string
  /** Colour of the primary button's label, which sits on a white face. */
  accentInk: string
  title: string
  subtitle?: string
  /** Stars won, or null for a game that has none. */
  stars: number | null
  /** Coins won, null while that is not known yet, 0 for a level already won before. */
  coins: number | null
  coinsLabel: (coins: number) => string
  noCoinsLabel: string
  /** Where the coins fly to, in window coordinates: the centre of the coin counter. */
  coinTarget: Point | null
  /** Called as each coin reaches the counter. */
  onCoinLanded: () => void
  /** Height left uncovered at the top, so the coin counter stays in sight. */
  top: number
  /** Safe-area inset under the buttons. */
  bottom: number
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
}

const MAX_STARS = 3
const STAR_START_MS = 350
const STAR_STEP_MS = 260
const COIN_STEP_MS = 160
const COIN_FLIGHT_MS = 1000
const COIN_SIZE = 40
const CONFETTI = 34
const CONFETTI_COLOURS = ["#FFD23F", "#FFFFFF", "#FF6B8B", "#5CC8FF", "#9BE564", "#FF9F43"]
/** Coins drawn in flight: two per coin won, so even one coin reads as a burst, and never a swarm. */
const MIN_FLYING = 4
const MAX_FLYING = 10

function Confetti({ index, width, height }: { index: number; width: number; height: number }) {
  const piece = useMemo(() => {
    const seed = Math.sin(index * 12.9898) * 43758.5453
    const random = (k: number) => {
      const value = Math.sin(seed + k * 78.233) * 10000
      return value - Math.floor(value)
    }
    return {
      x: random(1) * width,
      drift: (random(2) - 0.5) * 120,
      delay: random(3) * 600,
      duration: 1800 + random(4) * 1400,
      spin: (random(5) - 0.5) * 900,
      colour: CONFETTI_COLOURS[index % CONFETTI_COLOURS.length],
      w: 7 + random(6) * 6,
      h: 10 + random(7) * 8,
    }
  }, [height, index, width])

  const fall = useSharedValue(0)
  useEffect(() => {
    fall.set(withDelay(piece.delay, withTiming(1, { duration: piece.duration, easing: Easing.in(Easing.quad) })))
  }, [fall, piece])

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: piece.x + piece.drift * fall.get() },
      { translateY: -40 + (height + 80) * fall.get() },
      { rotate: `${piece.spin * fall.get()}deg` },
    ],
  }))

  return (
    <Animated.View
      style={[styles.confetti, { width: piece.w, height: piece.h, backgroundColor: piece.colour }, style]}
    />
  )
}

function PoppingStar({ index, won }: { index: number; won: boolean }) {
  const scale = useSharedValue(0)
  useEffect(() => {
    const delay = STAR_START_MS + index * STAR_STEP_MS
    scale.set(withDelay(delay, withSpring(1, { damping: 7, stiffness: 180 })))
    if (!won) return
    const timer = setTimeout(hapticKey, delay)
    return () => clearTimeout(timer)
  }, [index, scale, won])
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }, { rotate: `${(1 - scale.get()) * -40}deg` }],
  }))
  return (
    <Animated.View style={style}>
      <StarIcon size={index === 1 ? 72 : 56} color={won ? "#FFD23F" : "rgba(255,255,255,0.28)"} />
    </Animated.View>
  )
}

function FlyingCoin({ from, to, delay }: { from: Point; to: Point; delay: number }) {
  const progress = useSharedValue(0)
  useEffect(() => {
    progress.set(withDelay(delay, withTiming(1, { duration: COIN_FLIGHT_MS, easing: Easing.inOut(Easing.cubic) })))
  }, [delay, progress])
  const style = useAnimatedStyle(() => {
    const t = progress.get()
    // A lift in the middle of the flight turns the straight line into an arc.
    const arc = -180 * 4 * t * (1 - t)
    return {
      // Hidden before take-off and once landed, where the counter takes over.
      opacity: t === 0 || t === 1 ? 0 : 1,
      transform: [
        { translateX: from.x + (to.x - from.x) * t - COIN_SIZE / 2 },
        { translateY: from.y + (to.y - from.y) * t + arc - COIN_SIZE / 2 },
        { scale: 1.3 - 0.8 * t },
        { rotate: `${t * 540}deg` },
      ],
    }
  })
  return (
    <Animated.View pointerEvents="none" style={[styles.flying, style]}>
      <GoldCoin size={COIN_SIZE} />
    </Animated.View>
  )
}

/**
 * The screen that says a level is won: confetti, the stars popping in one by
 * one, then the coins flying up to the counter, which counts them as they land.
 */
export function LevelComplete(props: LevelCompleteProps) {
  const { accent, stars, coins, coinTarget, onCoinLanded, top } = props
  const { width, height } = useWindowDimensions()
  const [coinOrigin, setCoinOrigin] = useState<Point | null>(null)
  const coinRow = useRef<ComponentRef<typeof View>>(null)
  const landed = useRef(onCoinLanded)
  landed.current = onCoinLanded

  const enter = useSharedValue(0)
  useEffect(() => {
    hapticSuccess()
    enter.set(withTiming(1, { duration: 260 }))
  }, [enter])

  const starsDone = STAR_START_MS + (stars === null ? 0 : MAX_STARS * STAR_STEP_MS)
  const flying = !coins ? 0 : Math.min(Math.max(coins * 2, MIN_FLYING), MAX_FLYING)

    useEffect(() => {
    if (!coins || !coinOrigin || !coinTarget) return
    const timers = Array.from({ length: flying }, (_, index) =>
      setTimeout(
        () => {
          // Arrivals share the coins out evenly; the counter moves on the ones that carry one.
          const share = Math.floor(((index + 1) * coins) / flying) - Math.floor((index * coins) / flying)
          for (let i = 0; i < share; i++) landed.current()
          if (share > 0) hapticKey()
        },
        starsDone + index * COIN_STEP_MS + COIN_FLIGHT_MS
      )
    )
    return () => timers.forEach(clearTimeout)
  }, [coinOrigin, coinTarget, coins, flying, starsDone])

  const backdrop = useAnimatedStyle(() => ({ opacity: enter.get() }))
  const card = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - enter.get()) * 40 }, { scale: 0.9 + 0.1 * enter.get() }],
  }))
  const buttons = useAnimatedStyle(() => ({ opacity: enter.get() }))

  return (
    <View style={[StyleSheet.absoluteFill, { top }]} accessibilityViewIsModal>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: accent }, backdrop]} />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {Array.from({ length: CONFETTI }, (_, index) => (
          <Confetti key={index} index={index} width={width} height={height - top} />
        ))}
      </View>

      <Animated.View style={[styles.body, card]}>
        <Text accessibilityRole="header" accessibilityLiveRegion="assertive" style={styles.title}>
          {props.title}
        </Text>
        {props.subtitle ? <Text style={styles.subtitle}>{props.subtitle}</Text> : null}

        {stars !== null && (
          <View accessible accessibilityLabel={`${stars} / ${MAX_STARS}`} style={styles.stars}>
            {Array.from({ length: MAX_STARS }, (_, index) => (
              <PoppingStar key={index} index={index} won={index < stars} />
            ))}
          </View>
        )}

        <View
          ref={coinRow}
          collapsable={false}
          onLayout={() =>
            coinRow.current?.measureInWindow((x, y, w, h) => setCoinOrigin({ x: x + w / 2, y: y + h / 2 }))
          }
          style={styles.reward}
        >
          {coins === null ? null : coins > 0 ? (
            <>
              <GoldCoin size={30} />
              <Text style={styles.rewardLabel}>{props.coinsLabel(coins)}</Text>
            </>
          ) : (
            <Text style={styles.noReward}>{props.noCoinsLabel}</Text>
          )}
        </View>
      </Animated.View>

      <Animated.View style={[styles.actions, { paddingBottom: props.bottom + 16 }, buttons]}>
        <PressableSurface
          onPress={props.onPrimary}
          accessibilityLabel={props.primaryLabel}
          face="#FFFFFF"
          radius={16}
          height={60}
        >
          <Text style={[styles.primaryLabel, { color: props.accentInk }]}>{props.primaryLabel}</Text>
        </PressableSurface>
        {props.secondaryLabel && props.onSecondary && (
          <PressableSurface
            onPress={props.onSecondary}
            accessibilityLabel={props.secondaryLabel}
            face="rgba(255,255,255,0.16)"
            radius={16}
            height={52}
          >
            <Text style={styles.secondaryLabel}>{props.secondaryLabel}</Text>
          </PressableSurface>
        )}
      </Animated.View>

      {coinOrigin && coinTarget && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { top: -top }]}>
          {Array.from({ length: flying }, (_, index) => (
            <FlyingCoin
              key={index}
              from={coinOrigin}
              to={coinTarget}
              delay={starsDone + index * COIN_STEP_MS}
            />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  confetti: { position: "absolute", top: 0, left: 0, borderRadius: 2 },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 18 },
  title: { fontFamily: fonts.display, fontSize: 40, color: "#FFFFFF", textAlign: "center" },
  subtitle: { fontFamily: fonts.body, fontSize: 17, color: "rgba(255,255,255,0.85)", textAlign: "center" },
  stars: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginTop: 6 },
  reward: {
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  rewardLabel: { fontFamily: fonts.display, fontSize: 24, color: "#FFFFFF" },
  noReward: { fontFamily: fonts.body, fontSize: 15, color: "rgba(255,255,255,0.85)" },
  actions: { paddingHorizontal: 20, gap: 10 },
  primaryLabel: { fontFamily: fonts.display, fontSize: 20 },
  secondaryLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: "#FFFFFF" },
  flying: { position: "absolute", top: 0, left: 0 },
})
