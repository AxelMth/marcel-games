"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"
import type { Locale } from "@/lib/i18n"
import type { GameMode, GameState } from "@/lib/game-store"
import {
  createGameState,
  createLocalGameState,
  getSavedLocale,
  isDailyCompleted,
  levelFromApi,
  saveLocale,
  toBackendGameMode,
  toBackendLocale,
} from "@/lib/game-store"
import { useDeviceUuid } from "@/hooks/use-device-uuid"
import { getLaunchDeviceInfo } from "@marcel-games/lib"
import { getLevel, getProgress, postLaunch, type ProgressResponse } from "@/lib/api"
import { flushPendingResults } from "@/lib/pending-results"
import { readStoredUserId, storeUserId } from "@/lib/user-id"

type Screen = "home" | "game" | "stats"

interface AppContextValue {
  screen: Screen
  locale: Locale
  gameState: GameState | null
  setLocale: (locale: Locale) => void
  startGame: (mode: GameMode) => Promise<void>
  goHome: () => void
  setGameState: (stateOrUpdater: GameState | ((prev: GameState | null) => GameState | null)) => void
  // Progress & stats from API
  userId: string | null
  progress: ProgressResponse | null
  setProgress: Dispatch<SetStateAction<ProgressResponse | null>>
  isLoadingProgress: boolean
  setLoadingProgress: (loading: boolean) => void
  isStartingGame: boolean
  goToStats: () => void
  gameError: string | null
  setGameError: (err: string | null) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const deviceUuid = useDeviceUuid()
  const [screen, setScreen] = useState<Screen>("home")
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en"
    return getSavedLocale()
  })
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [progress, setProgress] = useState<ProgressResponse | null>(null)
  const [isLoadingProgress, setLoadingProgress] = useState(false)
  const [isStartingGame, setStartingGame] = useState(false)
  const [gameError, setGameError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // The id read back from storage, available before any network call. Without
  // it a cold start with no network has nothing to ask the stats screen with.
  useEffect(() => {
    let cancelled = false
    readStoredUserId().then((stored) => {
      if (!cancelled && stored) setUserId((current) => current ?? stored)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Registering the device is what creates the user server-side; until it runs,
  // every other endpoint is being called with an id the backend never issued.
  const hasLaunched = useRef(false)
  useEffect(() => {
    if (!deviceUuid || hasLaunched.current) return
    hasLaunched.current = true

    const launch = async () => {
      try {
        const deviceInfo = await getLaunchDeviceInfo()
        const data = await postLaunch({
          deviceUUID: deviceUuid,
          ...deviceInfo,
          gameMode: "NORMAL",
          locale: toBackendLocale(locale),
        })
        setUserId(data.userId)
        await storeUserId(data.userId)
        // Results banked while offline are replayed in order, oldest first.
        await flushPendingResults(data.userId)
      } catch {
        // Offline: the stored id (if any) still drives the local experience,
        // and the next launch retries.
      }
    }

    void launch()
    // locale is read once, at launch: changing language must not re-register
    // the device.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceUuid])

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

  const startGame = useCallback(
    async (mode: GameMode) => {
      setGameError(null)
      setStartingGame(true)

      // The server owns the progression, so it is asked first. When it cannot
      // answer, the bundled catalogue takes over: the same generator produced
      // both, so the offline puzzle is the one the server would have sent.
      let state: GameState | null = null
      if (userId) {
        try {
          const response = await getLevel({
            userId,
            gameMode: toBackendGameMode(mode),
            locale: toBackendLocale(locale),
          })
          const level = levelFromApi(response)
          if (level) {
            state = createGameState(mode, level)
          } else if (mode === "daily") {
            // An answered request with no puzzle means the daily is already
            // done. Falling back to the local catalogue here would hand the
            // player the very puzzle they just solved.
            setProgress((p) => (p ? { ...p, dailyCompleted: true } : p))
            setStartingGame(false)
            return
          }
        } catch {
          // Fall through to the local catalogue.
        }
      }

      // Offline, the local record of today's daily is the only thing standing
      // between the player and an unlimited daily challenge.
      if (!state && mode === "daily" && isDailyCompleted()) {
        setStartingGame(false)
        return
      }

      setGameState(state ?? createLocalGameState(mode, locale))
      setScreen("game")
      setStartingGame(false)
    },
    [userId, locale]
  )

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
        isStartingGame,
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
