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
import {
  flushPendingResults,
  pendingResultCount,
  shouldBlockOfflineStart,
} from "@/lib/pending-results"
import { getProgressCache, setProgressCache } from "@/lib/progress-cache"
import { reconcileCoins } from "@/lib/coins"
import { readStoredUserId, storeUserId } from "@/lib/user-id"
import { t } from "@/lib/i18n"

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
        // A reinstall gets its balance back here, before any screen asks.
        if (typeof data.coins === "number") reconcileCoins(data.coins)
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

  const refreshProgress = useCallback(
    (id: string) => {
      setLoadingProgress(true)
      return getProgress(id)
        .then((p) => {
          setProgress(p)
          setProgressCache(p)
          // The server owns the balance; this is where the weekly refill and
          // any offline spend it has since applied reach the local mirror.
          if (typeof p.coins === "number") reconcileCoins(p.coins)
        })
        // Offline, the last confirmed progression is a far better answer than
        // none: a null here rendered "Level 1" to a player forty levels in.
        .catch(() => setProgress(getProgressCache()))
        .finally(() => setLoadingProgress(false))
    },
    []
  )

  useEffect(() => {
    if (screen !== "home" || !userId) return
    void refreshProgress(userId)
  }, [screen, userId, refreshProgress])

  /**
   * Drains the offline queue whenever the app has a fresh chance of reaching
   * the server.
   *
   * Replaying only at launch meant a player who finished levels on a train and
   * kept the app open stayed unsynced until they killed and reopened it. Both
   * events are best-effort hints, not proof of connectivity — navigator.onLine
   * lies behind a captive portal — so the flush is simply attempted and allowed
   * to fail. What actually gates offline play is the queue length, which is a
   * fact rather than a guess.
   */
  useEffect(() => {
    if (!userId) return

    const drain = () => {
      void flushPendingResults(userId).then((outcome) => {
        // Only worth a round trip if the queue actually moved.
        if (outcome.sent > 0) void refreshProgress(userId)
      })
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") drain()
    }

    window.addEventListener("online", drain)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.removeEventListener("online", drain)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [userId, refreshProgress])

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

      // The server did not answer and a stack of finished levels is already
      // waiting to be sent. One last attempt to drain it — the connection may
      // have come back since the queue was filled — and if it is still stuck,
      // stop here rather than letting the unsynced pile grow.
      if (!state && userId && shouldBlockOfflineStart(mode, pendingResultCount())) {
        await flushPendingResults(userId)
      }
      if (!state && shouldBlockOfflineStart(mode, pendingResultCount())) {
        setGameError(t(locale, "offlineLimit"))
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
