"use client"

import { useAppContext } from "@/lib/app-context"
import { SplashScreen } from "./splash-screen"
import { HomeScreen } from "./home-screen"
import { GameScreen } from "./game-screen"
import { AdMobInit } from "@marcel-games/lib"

export function WordClimbApp() {
  const { screen } = useAppContext()

  return (
    <>
      <AdMobInit />
      {screen === "splash" && <SplashScreen />}
      {screen === "home" && <HomeScreen />}
      {screen === "game" && <GameScreen />}
    </>
  )
}
