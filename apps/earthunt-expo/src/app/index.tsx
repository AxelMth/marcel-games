import { t, type Continent } from "@marcel-games/earthunt-core"
import { LegalLink, PressableSurface, colors, fonts } from "@marcel-games/expo-ui"
import { useRouter } from "expo-router"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { retryLoadProgress, useProgress } from "@/game/progress-store"
import { deviceLocale } from "@/lib/locale"

// Published from legal/ by the legal-pages workflow; the same URL goes into App Store Connect.
const LEGAL_URL = "https://axelmth.github.io/marcel-games/earthunt-privacy-and-terms"

const CONTINENTS: readonly Continent[] = ["EUROPE", "ASIA", "AMERICAS", "AFRICA", "OCEANIA"]

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const locale = deviceLocale()
  const state = useProgress()
  const levelLabel = (level: number) => `${t(locale, "continentSelect.level")} ${level}`

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 4 }]}>
      <View style={styles.hero}>
        <Text accessibilityRole="header" style={styles.wordmark}>
          {t(locale, "app.title")}
        </Text>
        <Text style={styles.tagline}>{t(locale, "app.subtitle")}</Text>
      </View>

      {state.status === "loading" && <ActivityIndicator color={colors.ink} />}

      {state.status === "error" && (
        <PressableSurface
          onPress={() => void retryLoadProgress()}
          accessibilityLabel={t(locale, "errors.failedToLoad")}
          face={colors.surface}
          border={colors.line}
          radius={14}
          height={56}
        >
          <Text style={styles.rowTitle}>{t(locale, "errors.failedToLoad")}</Text>
        </PressableSurface>
      )}

      {state.status === "ready" && (
        <View style={styles.modes}>
          <PressableSurface
            onPress={() =>
              router.push({ pathname: "/game", params: { level: String(state.progress.world) } })
            }
            accessibilityLabel={`${t(locale, "home.world")}, ${levelLabel(state.progress.world)}`}
            face={colors.ink}
            radius={14}
            height={72}
            style={styles.row}
          >
            <View style={styles.rowText}>
              <Text style={styles.worldTitle}>{t(locale, "home.world")}</Text>
              <Text style={styles.worldSubtitle}>{t(locale, "home.worldSubtitle")}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{levelLabel(state.progress.world)}</Text>
            </View>
          </PressableSurface>

          <Text style={styles.section}>{t(locale, "home.continent")}</Text>
          {CONTINENTS.map((continent) => {
            const level = state.progress.continents[continent] ?? 1
            const name = t(locale, `continentSelect.${continent}`)
            return (
              <PressableSurface
                key={continent}
                onPress={() =>
                  router.push({ pathname: "/game", params: { level: String(level), continent } })
                }
                accessibilityLabel={`${name}, ${levelLabel(level)}`}
                face={colors.surface}
                border={colors.line}
                radius={14}
                height={56}
                style={styles.row}
              >
                <Text style={styles.rowTitle}>{name}</Text>
                <Text style={styles.rowLevel}>{levelLabel(level)}</Text>
              </PressableSurface>
            )
          })}
        </View>
      )}

      <LegalLink url={LEGAL_URL} label={t(locale, "legal.open")} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground, paddingHorizontal: 16 },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  wordmark: { fontFamily: fonts.display, fontSize: 40, color: colors.ink },
  tagline: { fontFamily: fonts.body, fontSize: 16, color: colors.muted },
  modes: { gap: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18 },
  rowText: { gap: 2, flexShrink: 1 },
  worldTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.surface },
  worldSubtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.starOff },
  chip: {
    height: 36,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
    backgroundColor: colors.inkSoft,
  },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.surface },
  section: {
    marginTop: 10,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.muted,
  },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  rowLevel: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
})
