import { colors } from "@marcel-games/expo-ui"
import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react"
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native"
import Svg, { Path, Rect } from "react-native-svg"
import { MAP_HEIGHT, MAP_WIDTH, SHAPES } from "@/map/shapes"

const SEA = "#CFE6F3"
const LAND = "#8CC084"
const LAND_OUTSIDE = "#DCE7D6"
const LAND_STROKE = "#F4F8F1"
const FOUND = "#2E9D6A"
const MAX_ZOOM = 10
/** Quiet time after the last scroll or pinch before the map is redrawn sharp. */
const SETTLE_MS = 160
/** Below this zoom the scaled drawing is sharp enough. */
const SHARP_FROM_ZOOM = 1.05

/** The part of the map on screen, in map units. */
interface Region {
  x: number
  y: number
  width: number
  height: number
}
/** Room left around a country or a continent when the map frames it, in map units. */
const FRAME_MARGIN = 12
/** A level with more countries than any continent holds is a whole-world level. */
const WHOLE_WORLD = 100

type Box = readonly [number, number, number, number]

function boxAround(codes: readonly string[]): Box | null {
  const boxes = SHAPES.filter((shape) => codes.includes(shape.code)).map((shape) => shape.frame)
  if (boxes.length === 0) return null
  return [
    Math.min(...boxes.map((box) => box[0])),
    Math.min(...boxes.map((box) => box[1])),
    Math.max(...boxes.map((box) => box[2])),
    Math.max(...boxes.map((box) => box[3])),
  ]
}

// Zooming to a rectangle is an iOS scroll-view feature that React Native's
// types do not expose on the component ref, hence the structural type.
interface ZoomableScroll {
  scrollResponderZoomTo?: (rect: {
    x: number
    y: number
    width: number
    height: number
    animated: boolean
  }) => void
}

/** Frames a box given in map units, where one map unit is `unit` points. */
function zoomTo(scroll: unknown, box: Box, unit: number, animated: boolean): void {
  // React Native Web implements the method only to throw.
  if (Platform.OS === "web") return
  ;(scroll as ZoomableScroll | null)?.scrollResponderZoomTo?.({
    x: (box[0] - FRAME_MARGIN) * unit,
    y: (box[1] - FRAME_MARGIN) * unit,
    width: (box[2] - box[0] + FRAME_MARGIN * 2) * unit,
    height: (box[3] - box[1] + FRAME_MARGIN * 2) * unit,
    animated,
  })
}

interface WorldMapProps {
  /** Countries that belong to the level. The others are drawn faded, as scenery. */
  playable: readonly string[]
  /** Countries taken off the map, to be found. Drawn as sea until they are. */
  missing: readonly string[]
  found: readonly string[]
  /** The country a hint is pointing at, or null. */
  highlighted: string | null
}

export function WorldMap({ playable, missing, found, highlighted }: WorldMapProps) {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null)
  const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null)
  // One map unit is `unit` points: the scale at which the map fills the first
  // viewport it is given. It is then kept for the whole level — the viewport
  // shrinks when the keyboard opens, and rescaling the map under the player's
  // zoom would throw the view somewhere else entirely.
  const [unit, setUnit] = useState(0)
  // iOS zooms a scroll view by scaling a picture of its content, which blurs
  // the map. Once the player stops, the visible part is drawn again on top at
  // the screen's own resolution, and hidden as soon as they move it.
  const [sharp, setSharp] = useState<Region | null>(null)
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (settle.current) clearTimeout(settle.current)
    },
    []
  )
  const minZoom = viewport && unit > 0 ? Math.min(1, viewport.width / (MAP_WIDTH * unit)) : 1

  const playableKey = playable.join(",")
  // On a whole-world level the few outlines with no country of their own (South
  // Sudan, Western Sahara…) would otherwise stand out as pale holes.
  const wholeWorld = playable.length > WHOLE_WORLD
  const firstMissing = missing[0] ?? null
  const viewportWidth = viewport?.width ?? 0
  // Framed once per level. The viewport is measured again whenever the panel
  // under the map changes height, and re-centring then would fight the player's
  // own panning — or a hint that is zooming somewhere else.
  const framedLevel = useRef<string | null>(null)
  useEffect(() => {
    if (unit === 0 || framedLevel.current === playableKey) return
    framedLevel.current = playableKey
    const codes = playableKey.split(",")
    // A whole-world level opens filling the screen: framing every country at
    // once would shrink the world to a strip across a tall screen. It opens on
    // the first country to find, which may sit far from the middle of the map.
    if (codes.length > WHOLE_WORLD) {
      const target = firstMissing ? boxAround([firstMissing]) : null
      const centre = target ? (target[0] + target[2]) / 2 : MAP_WIDTH / 2
      const furthest = Math.max(0, MAP_WIDTH * unit - viewportWidth)
      const x = Math.min(furthest, Math.max(0, centre * unit - viewportWidth / 2))
      scroll.current?.scrollTo({ x, animated: false })
      return
    }
    const box = boxAround(codes)
    if (box) zoomTo(scroll.current, box, unit, false)
  }, [playableKey, firstMissing, unit, viewportWidth])

  // The map follows the action: the country a hint points at, else the one just
  // found. It is framed again when the viewport changes height, so opening the
  // keyboard does not leave it out of sight.
  const focus = highlighted ?? found.at(-1) ?? null
  const viewportHeight = viewport?.height ?? 0
  useEffect(() => setSharp(null), [viewportWidth, viewportHeight])

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent
    const zoomScale = event.nativeEvent.zoomScale ?? 1
    setSharp(null)
    if (settle.current) clearTimeout(settle.current)
    if (zoomScale < SHARP_FROM_ZOOM || unit === 0) return
    const scale = unit * zoomScale
    const region = {
      x: contentOffset.x / scale,
      y: contentOffset.y / scale,
      width: layoutMeasurement.width / scale,
      height: layoutMeasurement.height / scale,
    }
    settle.current = setTimeout(() => setSharp(region), SETTLE_MS)
  }

  const shapes = useMemo(
    () => (
      <>
        <Rect x={-MAP_WIDTH} y={-MAP_HEIGHT} width={MAP_WIDTH * 3} height={MAP_HEIGHT * 3} fill={SEA} />
        {SHAPES.map((shape) => {
          if (shape.code === highlighted) {
            return <Path key={shape.code} d={shape.d} fill={colors.star} />
          }
          if (found.includes(shape.code)) {
            return <Path key={shape.code} d={shape.d} fill={FOUND} stroke={LAND_STROKE} strokeWidth={0.4} />
          }
          // A country to find is a hole in the land, the colour of the sea.
          if (missing.includes(shape.code)) {
            return <Path key={shape.code} d={shape.d} fill={SEA} />
          }
          return (
            <Path
              key={shape.code}
              d={shape.d}
              fill={wholeWorld || playable.includes(shape.code) ? LAND : LAND_OUTSIDE}
              stroke={LAND_STROKE}
              strokeWidth={0.4}
            />
          )
        })}
      </>
    ),
    [found, highlighted, missing, playable, wholeWorld]
  )
  useEffect(() => {
    const box = focus ? boxAround([focus]) : null
    if (unit > 0 && viewportHeight > 0 && box) zoomTo(scroll.current, box, unit, true)
  }, [focus, unit, viewportHeight])

  return (
    <View
      style={styles.viewport}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout
        setViewport({ width, height })
        setUnit((current) => (current > 0 ? current : height / MAP_HEIGHT))
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {viewport && unit > 0 && (
        <ScrollView
          ref={scroll}
          bounces={false}
          bouncesZoom={false}
          centerContent
          minimumZoomScale={minZoom}
          maximumZoomScale={MAX_ZOOM}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ width: MAP_WIDTH * unit, height: MAP_HEIGHT * unit }}
          onScroll={onScroll}
          scrollEventThrottle={32}
        >
          <Svg
            width={MAP_WIDTH * unit}
            height={MAP_HEIGHT * unit}
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          >
            {shapes}
          </Svg>
        </ScrollView>
      )}
      {viewport && sharp && (
        <Svg
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          width={viewport.width}
          height={viewport.height}
          viewBox={`${sharp.x} ${sharp.y} ${sharp.width} ${sharp.height}`}
          preserveAspectRatio="xMinYMin slice"
        >
          {shapes}
        </Svg>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  viewport: { flex: 1, backgroundColor: SEA, overflow: "hidden" },
})
