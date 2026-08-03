"use client"

import { useEffect, useState } from "react"
import { useApp } from "@/lib/app-context"
import { askForTrackingPermission } from "@/lib/app-tracking-transparency"
import { isFirstVisit, setVisited } from "@/lib/game-store"
import { HomeScreen } from "./home-screen"
import { GameScreen } from "./game-screen"
import { StatsScreen } from "./stats-screen"
import { HelpModal } from "./help-modal"

export function WordClimbApp() {
  const { screen } = useApp()
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (isFirstVisit()) {
      setShowWelcome(true)
      setVisited()
    }
    // ATT first, then the UMP consent form. Without recorded consent AdMob
    // serves non-personalized ads in Europe, at a fraction of the revenue.
    // Both no-op off-device, so this is safe in the browser.
    askForTrackingPermission()
  }, [])

  return (
    <main className="min-h-[100dvh]">
      {screen === "home" && <HomeScreen />}
      {screen === "game" && <GameScreen />}
      {screen === "stats" && <StatsScreen />}

      {showWelcome && <HelpModal onClose={() => setShowWelcome(false)} />}
    </main>
  )
}
