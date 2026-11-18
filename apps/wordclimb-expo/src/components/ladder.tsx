import { t, type Locale, type PlaySession } from "@marcel-games/wordclimb-core"
import { useEffect, useRef, type ComponentRef } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import { FlagIcon } from "@/components/icons"
import { Mascot, MASCOT_HEIGHT } from "@/components/mascot"
import { Tile, type TileKind } from "@/components/tile"
import {
  LADDER_PAD_LEFT,
  LADDER_PAD_RIGHT,
  TILE_GAP,
  type LadderLayout,
} from "@/game/layout"
import { colors, fonts, LIP } from "@/theme/tokens"

const RAIL_WIDTH = 10
const RAIL_OFFSET = 22
const RAIL_OVERHANG = 14
const RUNG_OVERHANG = 14

interface RowModel {
  key: string
  chars: string[]
  kinds: TileKind[]
  celebrate: boolean
  shake: boolean
  label: string | undefined
}

/** The ladder top to bottom: goal first, then the rungs from last to first, then the start word. */
function buildRows(session: PlaySession, activeLabel: string): RowModel[] {
  const { game: state, typed, refused, celebrating } = session
  const { beginWord, endWord, wordLadder } = state.level
  const given = (key: string, word: string): RowModel => ({
    key,
    chars: [...word],
    kinds: [...word].map(() => "given"),
    celebrate: false,
    shake: false,
    label: word,
  })

  const rungs = wordLadder.map((word, index): RowModel => {
    const key = `rung-${index}`
    if (state.foundWords[index]) {
      return {
        key,
        chars: [...word],
        kinds: [...word].map(() => "found"),
        celebrate: celebrating === index,
        shake: false,
        label: word,
      }
    }
    if (index !== state.currentWordIndex) {
      return {
        key,
        chars: [...word].map(() => ""),
        kinds: [...word].map(() => "hidden"),
        celebrate: false,
        shake: false,
        label: undefined,
      }
    }
    return {
      key,
      chars: [...word].map((_, position) => typed[position] ?? ""),
      kinds: [...word].map((_, position): TileKind => {
        if (refused) return "error"
        if (position < typed.length) return "filled"
        return position === typed.length ? "caret" : "empty"
      }),
      celebrate: false,
      shake: refused,
      label: activeLabel,
    }
  })

  return [given("goal", endWord), ...rungs.reverse(), given("start", beginWord)]
}

function Row({ row, layout }: { row: RowModel; layout: LadderLayout }) {
  const offset = useSharedValue(0)

  useEffect(() => {
    if (!row.shake) return
    const step = { duration: 90 }
    offset.set(
      withSequence(
        withTiming(-9, step),
        withTiming(8, step),
        withTiming(-6, step),
        withTiming(4, step),
        withTiming(0, step)
      )
    )
  }, [offset, row.shake])

  const shake = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }))

  return (
    <View style={{ height: layout.tile + LIP }}>
      <View style={[styles.rung, { top: layout.tile / 2 - RAIL_WIDTH / 2 }]} />
      <Animated.View
        accessible={row.label !== undefined}
        accessibilityLabel={row.label}
        style={[styles.tiles, shake]}
      >
        {row.kinds.map((kind, position) => (
          <Tile
            key={position}
            kind={kind}
            char={row.chars[position]}
            size={layout.tile}
            index={position}
            celebrate={row.celebrate}
          />
        ))}
      </Animated.View>
    </View>
  )
}

interface LadderProps {
  session: PlaySession
  layout: LadderLayout
  /** Height of the area the ladder scrolls in, to keep the active rung in view. */
  viewportHeight: number
  locale: Locale
}

export function Ladder({ session, layout, viewportHeight, locale }: LadderProps) {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null)
  const state = session.game
  const rows = buildRows(session, t(locale, "enterWord"))
  const rungCount = state.level.wordLadder.length
  // The mascot waits on the rung being solved, and on the goal once the level is done.
  const mascotRow = state.isComplete ? 0 : rungCount - state.currentWordIndex
  const mascotTarget = mascotRow * layout.rowPitch + (layout.tile - MASCOT_HEIGHT) / 2
  const foundCount = state.foundWords.filter(Boolean).length

  const climb = useSharedValue(mascotTarget)
  useEffect(() => {
    climb.set(withSpring(mascotTarget, { damping: 12, stiffness: 140 }))
  }, [climb, mascotTarget])
  const mascotPosition = useAnimatedStyle(() => ({ transform: [{ translateY: climb.get() }] }))

  useEffect(() => {
    const rowTop = mascotRow * layout.rowPitch
    const centred = rowTop - viewportHeight / 2 + layout.tile
    scroll.current?.scrollTo({ y: Math.max(0, centred), animated: true })
  }, [layout.rowPitch, layout.tile, mascotRow, viewportHeight])

  const letters = state.level.beginWord.length
  const blockWidth = letters * layout.tile + (letters - 1) * TILE_GAP

  return (
    <ScrollView
      ref={scroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <View style={styles.caption}>
        <FlagIcon color={colors.muted} />
        <Text style={styles.captionText}>{t(locale, "ladderGoal")}</Text>
      </View>
      <View style={[styles.block, { width: blockWidth, gap: layout.rowGap }]}>
        <View style={[styles.rail, { left: -RAIL_OFFSET }]} />
        <View style={[styles.rail, { right: -RAIL_OFFSET }]} />
        {rows.map((row) => (
          <Row key={row.key} row={row} layout={layout} />
        ))}
        <Animated.View style={[styles.mascot, { left: blockWidth + 4 }, mascotPosition]}>
          <Mascot hopKey={foundCount} />
        </Animated.View>
      </View>
      <View style={styles.caption}>
        <Text style={styles.captionText}>{t(locale, "ladderStart")}</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 8,
    paddingLeft: LADDER_PAD_LEFT,
    paddingRight: LADDER_PAD_RIGHT,
  },
  caption: { flexDirection: "row", alignItems: "center", gap: 6 },
  captionText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.muted,
  },
  block: { marginVertical: 6 },
  rail: {
    position: "absolute",
    top: -RAIL_OVERHANG,
    bottom: -RAIL_OVERHANG,
    width: RAIL_WIDTH,
    borderRadius: RAIL_WIDTH / 2,
    backgroundColor: colors.rail,
  },
  rung: {
    position: "absolute",
    left: -RUNG_OVERHANG,
    right: -RUNG_OVERHANG,
    height: RAIL_WIDTH,
    borderRadius: RAIL_WIDTH / 2,
    backgroundColor: colors.rail,
  },
  tiles: { flexDirection: "row", gap: TILE_GAP },
  mascot: { position: "absolute", top: 0 },
})
