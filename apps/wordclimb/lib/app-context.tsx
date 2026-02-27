"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { Locale } from "@/lib/i18n"
import type { GameMode, GameState } from "@/lib/game-store"
import { createGameState, getSavedLocale, saveLocale } from "@/lib/game-store"
import { useDeviceUuid } from "@/hooks/use-device-uuid"
import { getProgress, type ProgressResponse } from "@/lib/api"

type Screen = "home" | "game" | "stats"

interface AppContextValue {
  screen: Screen
  locale: Locale
  gameState: GameState | null
  setLocale: (locale: Locale) => void
  startGame: (mode: GameMode) => void
  goHome: () => void
  setGameState: (stateOrUpdater: GameState | ((prev: GameState | null) => GameState | null)) => void
  // Progress & stats from API
  userId: string | null
  progress: ProgressResponse | null
  setProgress: (p: ProgressResponse | null) => void
  isLoadingProgress: boolean
  setLoadingProgress: (loading: boolean) => void
  goToStats: () => void
  gameError: string | null
  setGameError: (err: string | null) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const userId = useDeviceUuid()
  const [screen, setScreen] = useState<Screen>("home")
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en"
    return getSavedLocale()
  })
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [progress, setProgress] = useState<ProgressResponse | null>(null)
  const [isLoadingProgress, setLoadingProgress] = useState(false)
  const [gameError, setGameError] = useState<string | null>(null)

  useEffect(() => {
    if (screen !== "home" || !userId) return
    setLoadingProgress(true)
    getProgress(userId)
      .then((p) => {
        setProgress(p)
      })
      .catch(() => setProgress(null))
      .finally(() => setLoadingProgress(false))
  }, [screen, userId])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    saveLocale(l)
  }, [])

  const startGame = useCallback((mode: GameMode) => {
    setGameError(null)
    const state = createGameState(mode)
    setGameState(state)
    setScreen("game")
  }, [])

  const goHome = useCallback(() => {
    setScreen("home")
    setGameState(null)
    setGameError(null)
  }, [])

  const goToStats = useCallback(() => {
    setScreen("stats")
  }, [])

  return (
    <AppContext.Provider
      value={{
        screen,
        locale,
        gameState,
        setLocale,
        startGame,
        goHome,
        setGameState,
        userId,
        progress,
        setProgress,
        isLoadingProgress,
        setLoadingProgress,
        goToStats,
        gameError,
        setGameError,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
