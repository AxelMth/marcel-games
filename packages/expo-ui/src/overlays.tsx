import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"
import Animated, { FadeInDown, FadeInUp, FadeOutUp } from "react-native-reanimated"
import { GoldCoin } from "./icons"
import { PressableSurface } from "./surface"
import { colors, fonts, MIN_TOUCH } from "./tokens"

const FLASH_MS = 2600
const HINT_STAGGER_MS = 50

export interface Flash {
  title: string
  detail?: string
}

/** A message that shows for a moment, then goes; showing another restarts the clock. */
export function useFlash(durationMs = FLASH_MS): [Flash | null, (flash: Flash) => void] {
  const [flash, setFlash] = useState<Flash | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )
  const show = useCallback(
    (next: Flash) => {
      if (timer.current) clearTimeout(timer.current)
      setFlash(next)
      timer.current = setTimeout(() => setFlash(null), durationMs)
    },
    [durationMs]
  )
  return [flash, show]
}

/** A banner laid over the top of the play area, so a warning never pushes the level around. */
export function Toast({ flash }: { flash: Flash | null }) {
  if (!flash) return null
  return (
    <Animated.View
      entering={FadeInUp.duration(200)}
      exiting={FadeOutUp.duration(200)}
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      style={styles.toast}
    >
      <Text style={styles.toastTitle}>{flash.title}</Text>
      {flash.detail ? <Text style={styles.toastDetail}>{flash.detail}</Text> : null}
    </Animated.View>
  )
}

/** A card laid over the top of the play area, for what a hint revealed. */
export function InfoBubble({ children }: { children: ReactNode }) {
  return (
    <Animated.View entering={FadeInUp.duration(200)} accessibilityLiveRegion="polite" style={styles.bubble}>
      {children}
    </Animated.View>
  )
}

export interface HintOption {
  key: string
  label: string
  cost: number
  /** Already bought on this step: free to look at again, so no price is shown. */
  taken: boolean
  onPress: () => void
}

/** The hints, stacked over the play area just above the button that opened them. */
export function HintStack({
  options,
  coinsLabel,
  style,
}: {
  options: HintOption[]
  coinsLabel: string
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View pointerEvents="box-none" style={[styles.stack, style]}>
      {options.map((option, index) => (
        <Animated.View
          key={option.key}
          entering={FadeInDown.delay((options.length - 1 - index) * HINT_STAGGER_MS).duration(180)}
          style={styles.hintShadow}
        >
          <PressableSurface
            onPress={option.onPress}
            accessibilityLabel={option.taken ? option.label : `${option.label}, ${option.cost} ${coinsLabel}`}
            face="#FFF4D6"
            border="#F5B921"
            radius={14}
            height={MIN_TOUCH + 4}
            style={styles.hint}
          >
            <Text style={styles.hintLabel}>{option.label}</Text>
            {!option.taken && (
              <View style={styles.cost}>
                <GoldCoin size={18} />
                <Text style={styles.costLabel}>{option.cost}</Text>
              </View>
            )}
          </PressableSurface>
        </Animated.View>
      ))}
    </View>
  )
}

const shadow = {
  shadowColor: "#14202B",
  shadowOpacity: 0.18,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
} as const

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.danger,
    gap: 2,
    zIndex: 3,
    ...shadow,
  },
  toastTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.surface },
  toastDetail: { fontFamily: fonts.body, fontSize: 13, color: "rgba(255,255,255,0.9)" },
  bubble: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
    zIndex: 2,
    ...shadow,
  },
  stack: { position: "absolute", right: 16, bottom: 10, alignItems: "flex-end", gap: 10, zIndex: 2 },
  hintShadow: { borderRadius: 14, ...shadow },
  hint: { flexDirection: "row", gap: 10, paddingHorizontal: 18 },
  hintLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  cost: { flexDirection: "row", alignItems: "center", gap: 4 },
  costLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: "#7A4F00" },
})
