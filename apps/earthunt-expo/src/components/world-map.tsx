import { colors } from "@marcel-games/expo-ui"
import { useEffect, useRef, useState, type ComponentRef } from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import Svg, { Path, Rect } from "react-native-svg"
import { MAP_HEIGHT, MAP_WIDTH, SHAPES } from "@/map/shapes"

const SEA = "#CFE6F3"
const LAND = "#8CC084"
const LAND_OUTSIDE = "#DCE7D6"
const LAND_STROKE = "#F4F8F1"
const FOUND = "#2E9D6A"
const MISSING_FILL = "#F6F8F2"
const MAX_ZOOM = 10
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
  /** Countries taken off the map, to be found. Drawn as a dashed outline until they are. */
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
  const minZoom = viewport && unit > 0 ? Math.min(1, viewport.width / (MAP_WIDTH * unit)) : 1

  const playableKey = playable.join(",")
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
        >
          <Svg
            width={MAP_WIDTH * unit}
            height={MAP_HEIGHT * unit}
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          >
            <Rect width={MAP_WIDTH} height={MAP_HEIGHT} fill={SEA} />
            {SHAPES.map((shape) => {
              if (shape.code === highlighted) {
                return <Path key={shape.code} d={shape.d} fill={colors.star} />
              }
              if (found.includes(shape.code)) {
                return <Path key={shape.code} d={shape.d} fill={FOUND} stroke={LAND_STROKE} strokeWidth={0.4} />
              }
              if (missing.includes(shape.code)) {
                return (
                  <Path
                    key={shape.code}
                    d={shape.d}
                    fill={MISSING_FILL}
                    stroke={colors.lineStrong}
                    strokeWidth={0.6}
                    strokeDasharray="2 1.5"
                  />
                )
              }
              return (
                <Path
                  key={shape.code}
                  d={shape.d}
                  fill={playable.includes(shape.code) ? LAND : LAND_OUTSIDE}
                  stroke={LAND_STROKE}
                  strokeWidth={0.4}
                />
              )
            })}
          </Svg>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  viewport: { flex: 1, backgroundColor: SEA, overflow: "hidden" },
})
