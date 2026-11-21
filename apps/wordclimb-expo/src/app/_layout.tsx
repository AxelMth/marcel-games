import { Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter"
import { Outfit_600SemiBold } from "@expo-google-fonts/outfit"
import { useFonts } from "expo-font"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import { StyleSheet } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { loadProgress } from "@/game/progress-store"
import { loadWallet } from "@/game/wallet-store"
import { colors } from "@marcel-games/expo-ui"

void SplashScreen.preventAutoHideAsync()
void loadProgress()
void loadWallet()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_500Medium,
    Inter_600SemiBold,
    Outfit_600SemiBold,
  })
  const settled = fontsLoaded || fontError !== null

  useEffect(() => {
    if (fontError) console.error("Game fonts failed to load", fontError)
    if (settled) void SplashScreen.hideAsync()
  }, [fontError, settled])

  // Rendering before the fonts settle would flash the system font and reflow every tile.
  if (!settled) return null

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.ground },
        }}
      />
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
