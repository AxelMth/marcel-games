"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { Locale } from "@/lib/i18n"
import type { GameMode, GameState } from "@/lib/game-store"
import { createGameState, getSavedLocale, saveLocale } from "@/lib/game-store"

type Screen = "home" | "game"

interface AppContextValue {
  screen: Screen
  locale: Locale
  gameState: GameState | null
  setLocale: (locale: Locale) => void
  startGame: (mode: GameMode) => void
  goHome: () => void
  setGameState: (stateOrUpdater: GameState | ((prev: GameState | null) => GameState | null)) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>("home")
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en"
    return getSavedLocale()
  })
  const [gameState, setGameState] = useState<GameState | null>(null)

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    saveLocale(l)
  }, [])

  const startGame = useCallback((mode: GameMode) => {
    const state = createGameState(mode)
    setGameState(state)
    setScreen("game")
  }, [])

  const goHome = useCallback(() => {
    setScreen("home")
    setGameState(null)
  }, [])

  return (
    <AppContext.Provider
      value={{ screen, locale, gameState, setLocale, startGame, goHome, setGameState }}
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
