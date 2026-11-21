import { Linking, StyleSheet, Text } from "react-native"
import { Pressable } from "react-native-gesture-handler"
import { MIN_TOUCH, colors, fonts } from "./tokens"

async function openPage(url: string): Promise<void> {
  try {
    await Linking.openURL(url)
  } catch (error) {
    console.error(`Could not open ${url}`, error)
  }
}

/** The link to an app's privacy page, which the stores require to be reachable from inside the app. */
export function LegalLink({ url, label }: { url: string; label: string }) {
  return (
    <Pressable accessibilityRole="link" onPress={() => void openPage(url)} style={styles.link}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  link: { minHeight: MIN_TOUCH, alignItems: "center", justifyContent: "center" },
  label: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    textDecorationLine: "underline",
  },
})
