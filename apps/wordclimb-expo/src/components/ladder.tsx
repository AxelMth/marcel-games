import { t, type Locale, type PlaySession } from "@marcel-games/wordclimb-core"
import { useEffect, useRef, type ComponentRef } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated"
import { Tile, type TileKind } from "@/components/tile"
import { LADDER_PAD, TILE_GAP, type LadderLayout } from "@/game/layout"
import { colors, fonts } from "@marcel-games/expo-ui"

const MARK_SIZE = 12
/** Distance from the tiles to the centre of the progress line on their left. */
const TRACK_OFFSET = 20

type Mark = "given" | "found" | "current" | "hidden"

interface RowModel {
  key: string
  chars: string[]
  kinds: TileKind[]
  mark: Mark
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
    mark: "given",
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
        mark: "found",
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
        mark: "hidden",
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
      mark: "current",
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
    const step = { duration: 80 }
    offset.set(
      withSequence(
        withTiming(-6, step),
        withTiming(5, step),
        withTiming(-3, step),
        withTiming(0, step)
      )
    )
  }, [offset, row.shake])

  const shake = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }))

  return (
    <View style={{ height: layout.tile }}>
      <View style={[styles.mark, MARKS[row.mark], { top: (layout.tile - MARK_SIZE) / 2 }]} />
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
  const activeRow = state.isComplete ? 0 : state.level.wordLadder.length - state.currentWordIndex

  useEffect(() => {
    const rowTop = activeRow * layout.rowPitch
    const centred = rowTop - viewportHeight / 2 + layout.tile
    scroll.current?.scrollTo({ y: Math.max(0, centred), animated: true })
  }, [activeRow, layout.rowPitch, layout.tile, viewportHeight])

  const letters = state.level.beginWord.length
  const blockWidth = letters * layout.tile + (letters - 1) * TILE_GAP

  return (
    <ScrollView
      ref={scroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.caption}>{t(locale, "ladderGoal")}</Text>
      <View style={[styles.block, { width: blockWidth, gap: layout.rowGap }]}>
        <View style={[styles.track, { top: layout.tile / 2, bottom: layout.tile / 2 }]} />
        {rows.map((row) => (
          <Row key={row.key} row={row} layout={layout} />
        ))}
      </View>
      <Text style={styles.caption}>{t(locale, "ladderStart")}</Text>
    </ScrollView>
  )
}

const MARKS = StyleSheet.create({
  given: { backgroundColor: colors.ink, borderColor: colors.ink },
  found: { backgroundColor: colors.found, borderColor: colors.found },
  current: { backgroundColor: colors.ground, borderColor: colors.ink },
  hidden: { backgroundColor: colors.ground, borderColor: colors.line },
})

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingVertical: 8,
    paddingHorizontal: LADDER_PAD,
  },
  caption: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.muted,
  },
  block: { marginVertical: 4 },
  track: {
    position: "absolute",
    left: -TRACK_OFFSET - 1,
    width: 2,
    backgroundColor: colors.line,
  },
  mark: {
    position: "absolute",
    left: -TRACK_OFFSET - MARK_SIZE / 2,
    width: MARK_SIZE,
    height: MARK_SIZE,
    borderRadius: MARK_SIZE / 2,
    borderWidth: 2,
  },
  tiles: { flexDirection: "row", gap: TILE_GAP },
})
