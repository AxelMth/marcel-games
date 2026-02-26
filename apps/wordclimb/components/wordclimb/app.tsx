"use client"

import { useEffect, useState } from "react"
import { useApp } from "@/lib/app-context"
import { isFirstVisit, setVisited } from "@/lib/game-store"
import { HomeScreen } from "./home-screen"
import { GameScreen } from "./game-screen"
import { HelpModal } from "./help-modal"

export function WordClimbApp() {
  const { screen } = useApp()
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (isFirstVisit()) {
      setShowWelcome(true)
      setVisited()
    }
  }, [])

  return (
    <main className="min-h-[100dvh]">
      {screen === "home" && <HomeScreen />}
      {screen === "game" && <GameScreen />}

      {showWelcome && <HelpModal onClose={() => setShowWelcome(false)} />}
    </main>
  )
}
