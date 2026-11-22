import { useState } from "react"
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native"
import { ChevronLeftIcon, StarIcon } from "./icons"
import { PressableSurface } from "./surface"
import { colors, fonts, MIN_TOUCH } from "./tokens"

export interface StatTile {
  value: string
  label: string
  face: string
  ink: string
  muted: string
}

export interface HistoryItem {
  key: string
  badge: string
  badgeFace: string
  badgeInk: string
  title: string
  subtitle: string
  stars: number
  /** Which tab shows it, besides the first one. */
  tab: string
}

export interface StatsTab {
  key: string
  label: string
}

interface StatsScreenProps {
  /** Safe-area insets, from the app. */
  insets: { top: number; bottom: number }
  title: string
  backLabel: string
  onBack: () => void
  ground: string
  tabTray: string
  state: "loading" | "error" | "ready"
  errorLabel: string
  retryLabel: string
  onRetry: () => void
  emptyLabel: string
  tiles: StatTile[]
  /** The first tab shows everything. */
  tabs: StatsTab[]
  items: HistoryItem[]
}

const MAX_STARS = 3

function Stars({ count }: { count: number }) {
  return (
    <View accessible accessibilityLabel={`${count} / ${MAX_STARS}`} style={styles.stars}>
      {Array.from({ length: MAX_STARS }, (_, index) => (
        <StarIcon key={index} size={15} color={index < count ? "#F5B921" : colors.starOff} />
      ))}
    </View>
  )
}

/** The player's ranks and their last levels, as both games show them. */
export function StatsScreen(props: StatsScreenProps) {
  const { insets } = props
  const [tab, setTab] = useState(props.tabs[0]?.key ?? "")
  const shown = tab === props.tabs[0]?.key ? props.items : props.items.filter((item) => item.tab === tab)

  return (
    <View style={[styles.screen, { backgroundColor: props.ground, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <PressableSurface
          onPress={props.onBack}
          accessibilityLabel={props.backLabel}
          face={colors.surface}
          border={colors.line}
          radius={12}
          height={MIN_TOUCH}
          outerStyle={styles.back}
        >
          <ChevronLeftIcon size={20} color={colors.ink} />
        </PressableSurface>
        <Text accessibilityRole="header" style={styles.title}>
          {props.title}
        </Text>
      </View>

      {props.state === "loading" && <ActivityIndicator style={styles.loading} color={colors.ink} />}

      {props.state === "error" && (
        <View style={styles.error}>
          <Text style={styles.errorLabel}>{props.errorLabel}</Text>
          <PressableSurface
            onPress={props.onRetry}
            accessibilityLabel={props.retryLabel}
            face={colors.surface}
            border={colors.line}
            radius={12}
            height={MIN_TOUCH}
            style={styles.retry}
          >
            <Text style={styles.retryLabel}>{props.retryLabel}</Text>
          </PressableSurface>
        </View>
      )}

      {props.state === "ready" && (
        <FlatList
          data={shown}
          keyExtractor={(item) => item.key}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          ListHeaderComponent={
            <View style={styles.top}>
              <View style={styles.tiles}>
                {props.tiles.map((tile) => (
                  <View key={tile.label} style={[styles.tile, { backgroundColor: tile.face }]}>
                    <Text style={[styles.tileValue, { color: tile.ink }]}>{tile.value}</Text>
                    <Text style={[styles.tileLabel, { color: tile.muted }]}>{tile.label}</Text>
                  </View>
                ))}
              </View>
              <View accessibilityRole="tablist" style={[styles.tabs, { backgroundColor: props.tabTray }]}>
                {props.tabs.map((entry) => (
                  <PressableSurface
                    key={entry.key}
                    onPress={() => setTab(entry.key)}
                    accessibilityLabel={entry.label}
                    face={entry.key === tab ? colors.surface : "transparent"}
                    radius={10}
                    height={40}
                    outerStyle={styles.tab}
                  >
                    <Text style={styles.tabLabel}>{entry.label}</Text>
                  </PressableSurface>
                ))}
              </View>
            </View>
          }
          ListEmptyComponent={<Text style={styles.empty}>{props.emptyLabel}</Text>}
          ItemSeparatorComponent={() => <View style={styles.gap} />}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={[styles.badge, { backgroundColor: item.badgeFace }]}>
                <Text style={[styles.badgeLabel, { color: item.badgeInk }]} numberOfLines={1}>
                  {item.badge}
                </Text>
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>
              <Stars count={item.stars} />
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { height: 56, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  back: { width: MIN_TOUCH },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  loading: { marginTop: 40 },
  error: { padding: 24, gap: 14, alignItems: "center" },
  errorLabel: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, textAlign: "center" },
  retry: { paddingHorizontal: 18 },
  retryLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  list: { paddingHorizontal: 16 },
  top: { gap: 14, paddingTop: 4, paddingBottom: 14 },
  tiles: { flexDirection: "row", gap: 10 },
  tile: { flex: 1, borderRadius: 16, padding: 12, gap: 2 },
  tileValue: { fontFamily: fonts.display, fontSize: 28 },
  tileLabel: { fontFamily: fonts.body, fontSize: 12 },
  tabs: { flexDirection: "row", gap: 6, padding: 4, borderRadius: 14 },
  tab: { flex: 1 },
  tabLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  empty: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: "center", marginTop: 24 },
  gap: { height: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  badge: { width: 48, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  badgeLabel: { fontFamily: fonts.display, fontSize: 14 },
  itemText: { flex: 1, gap: 3 },
  itemTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  itemSubtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  stars: { flexDirection: "row", gap: 2 },
})
