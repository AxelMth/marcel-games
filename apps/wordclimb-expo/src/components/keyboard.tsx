import { t, type Locale } from "@marcel-games/wordclimb-core"
import { StyleSheet, Text, View } from "react-native"
import { BackspaceIcon } from "@marcel-games/expo-ui"
import { PressableSurface } from "@marcel-games/expo-ui"
import { colors, fonts } from "@marcel-games/expo-ui"

/** The layout a player of each language already has under their thumbs. */
const LAYOUTS: Record<Locale, readonly [string, string, string]> = {
  fr: ["azertyuiop", "qsdfghjklm", "wxcvbn"],
  en: ["qwertyuiop", "asdfghjkl", "zxcvbnm"],
}

/** Every row is laid out against the width of the longest one. */
const COLUMNS = 10
const KEY_HEIGHT = 50
const KEY_RADIUS = 8

interface KeyboardProps {
  locale: Locale
  onLetter: (letter: string) => void
  onErase: () => void
  disabled: boolean
  bottomInset: number
}

export function Keyboard({ locale, onLetter, onErase, disabled, bottomInset }: KeyboardProps) {
  const [top, middle, bottom] = LAYOUTS[locale]
  const middleMargin = (COLUMNS - middle.length) / 2
  const bottomSide = (COLUMNS - bottom.length) / 2

  const letterKeys = (row: string) =>
    [...row].map((letter) => (
      <PressableSurface
        key={letter}
        onPress={() => onLetter(letter)}
        accessibilityLabel={`${t(locale, "letterKey")} ${letter.toUpperCase()}`}
        immediate
        disabled={disabled}
        face={colors.surface}
        border={colors.line}
        radius={KEY_RADIUS}
        height={KEY_HEIGHT}
        outerStyle={styles.key}
      >
        <Text style={styles.letter}>{letter.toUpperCase()}</Text>
      </PressableSurface>
    ))

  return (
    <View style={[styles.tray, { paddingBottom: bottomInset + 8 }]}>
      <View style={styles.row}>{letterKeys(top)}</View>
      <View style={styles.row}>
        {middleMargin > 0 && <View style={{ flex: middleMargin }} />}
        {letterKeys(middle)}
        {middleMargin > 0 && <View style={{ flex: middleMargin }} />}
      </View>
      <View style={styles.row}>
        <View style={{ flex: bottomSide }} />
        {letterKeys(bottom)}
        <PressableSurface
          onPress={onErase}
          accessibilityLabel={t(locale, "eraseLetter")}
          immediate
          disabled={disabled}
          face={colors.ink}
          radius={KEY_RADIUS}
          height={KEY_HEIGHT}
          outerStyle={{ flex: bottomSide }}
        >
          <BackspaceIcon color={colors.surface} />
        </PressableSurface>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  tray: {
    backgroundColor: colors.tray,
    paddingTop: 12,
    paddingHorizontal: 8,
    gap: 7,
  },
  row: { flexDirection: "row", gap: 5 },
  key: { flex: 1 },
  letter: {
    alignSelf: "stretch",
    textAlign: "center",
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.ink,
  },
})
