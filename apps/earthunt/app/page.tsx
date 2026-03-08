"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useGameStore } from "@/lib/game-store"
import { HomeScreen } from "@/components/home-screen"
import { ContinentSelect } from "@/components/continent-select"
import { GameScreen } from "@/components/game-screen"
import { SuccessScreen } from "@/components/success-screen"
import { SplashScreen } from "@/components/splash-screen"
import { StatsScreen } from "@/components/stats-screen"
import { askForTrackingPermission } from "@/lib/app-tracking-transparency"
import { useLaunch } from "@/hooks/use-launch"
import { getProgress } from "@/lib/api"
import { getProgressCache, setProgressCache } from "@/lib/progress-cache"

const SPLASH_STORAGE_KEY = "splash-done"

export default function Page() {
  const screen = useGameStore((s) => s.screen)
  const setUserId = useGameStore((s) => s.setUserId)
  const setProgress = useGameStore((s) => s.setProgress)
  const progress = useGameStore((s) => s.progress)
  const [showSplash, setShowSplash] = useState<boolean | null>(null)
  const [initLoading, setInitLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const initStartedRef = useRef(false)
  const { launch } = useLaunch()

  const runInit = useCallback(async () => {
    setInitLoading(true)
    setInitError(null)
    try {
      const uid = await launch("WORLD", "")
      if (uid) setUserId(uid)
      if (uid) {
        try {
          const p = await getProgress(uid)
          const next = {
            worldLevel: p.worldLevel,
            continentLevels: p.continentLevels ?? {},
            dailyCompleted: p.dailyCompleted,
          }
          setProgress(next)
          setProgressCache(next)
        } catch (progressError) {
          const cached =
            typeof window !== "undefined" ? getProgressCache() : null
          if (cached) {
            setProgress({
              worldLevel: cached.worldLevel,
              continentLevels: cached.continentLevels ?? {},
              dailyCompleted: cached.dailyCompleted,
            })
          } else {
            throw progressError
          }
        }
      }
    } catch (e) {
      setInitError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setInitLoading(false)
    }
  }, [launch, setUserId, setProgress])

  useEffect(() => {
    const done =
      typeof window !== "undefined" && sessionStorage.getItem(SPLASH_STORAGE_KEY)
    setShowSplash(!done)
  }, [])

  useEffect(() => {
    if (showSplash === false) {
      initStartedRef.current = false
      return
    }
    if (showSplash !== true) return
    if (initStartedRef.current) return
    initStartedRef.current = true
    runInit()
  }, [showSplash, runInit])

  useEffect(() => {
    if (showSplash === false && progress === null && typeof window !== "undefined") {
      const cached = getProgressCache()
      if (cached) {
        setProgress({
          worldLevel: cached.worldLevel,
          continentLevels: cached.continentLevels ?? {},
          dailyCompleted: cached.dailyCompleted,
        })
      }
    }
  }, [showSplash, progress, setProgress])

  const handleSplashComplete = () => {
    if (typeof window !== "undefined") sessionStorage.setItem(SPLASH_STORAGE_KEY, "1")
    setShowSplash(false)
    askForTrackingPermission()
  }

  if (showSplash === null) {
    return <div className="fixed inset-0 bg-[#69cbeb]" aria-hidden />
  }

  if (showSplash) {
    return (
      <SplashScreen
        initLoading={initLoading}
        initError={initError}
        onComplete={handleSplashComplete}
        onRetry={runInit}
      />
    )
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
