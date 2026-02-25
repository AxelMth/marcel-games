"use client"

import { useEffect, useState } from "react"
import { useGameStore } from "@/lib/game-store"
import { HomeScreen } from "@/components/home-screen"
import { ContinentSelect } from "@/components/continent-select"
import { GameScreen } from "@/components/game-screen"
import { SuccessScreen } from "@/components/success-screen"
import { SplashScreen } from "@/components/splash-screen"
import { StatsScreen } from "@/components/stats-screen"

const SPLASH_STORAGE_KEY = "splash-done"

export default function Page() {
  const screen = useGameStore((s) => s.screen)
  const [showSplash, setShowSplash] = useState<boolean | null>(null)

  useEffect(() => {
    const done =
      typeof window !== "undefined" && sessionStorage.getItem(SPLASH_STORAGE_KEY)
    setShowSplash(!done)
  }, [])

  const handleSplashComplete = () => {
    if (typeof window !== "undefined") sessionStorage.setItem(SPLASH_STORAGE_KEY, "1")
    setShowSplash(false)
  }

  if (showSplash === null) {
    return <div className="fixed inset-0 bg-[#69cbeb]" aria-hidden />
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  if (screen === "game") {
    return <GameScreen />
  }

  return (
    <div className="min-h-svh bg-gradient-to-b from-[#55b3d1] via-[#69cbeb] to-[#c0e8f0]">
      {screen === "home" && <HomeScreen />}
      {screen === "continent-select" && <ContinentSelect />}
      {screen === "success" && <SuccessScreen />}
      {screen === "stats" && <StatsScreen />}
    </div>
  )
}
