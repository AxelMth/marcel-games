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
  //
  // Retried rather than attempted once. An install first opened with no network
  // — downloaded on wifi, opened on a plane — got no id, and a one-shot attempt
  // left it that way for the whole session: results could only ever be queued,
  // never sent. Combined with the offline cap that is a dead end the player
  // cannot leave, so every reconnection chance tries again.
  const launching = useRef<Promise<string | null> | null>(null)
  const userIdRef = useRef<string | null>(null)
  userIdRef.current = userId

  const ensureUser = useCallback(async (): Promise<string | null> => {
    if (userIdRef.current) return userIdRef.current
    if (!deviceUuid) return null
    // Concurrent callers share one in-flight registration: the drain effect and
    // startGame can both ask at once, and postLaunch is an upsert that bumps
    // openCount every time it lands.
    if (!launching.current) {
      launching.current = (async () => {
        try {
          const deviceInfo = await getLaunchDeviceInfo()
          const data = await postLaunch({
            deviceUUID: deviceUuid,
            ...deviceInfo,
            gameMode: "NORMAL",
            locale: toBackendLocale(locale),
          })
          setUserId(data.userId)
          userIdRef.current = data.userId
          await storeUserId(data.userId)
          // A reinstall gets its balance back here, before any screen asks.
          if (typeof data.coins === "number") reconcileCoins(data.coins)
          return data.userId
        } catch {
          // Still offline. The stored id, if any, drives the local experience.
          return null
        } finally {
          launching.current = null
        }
      })()
    }
    return launching.current
    // locale is read at registration time: changing language must not
    // re-register the device.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceUuid])

  useEffect(() => {
    if (!deviceUuid) return
    void ensureUser().then((id) => {
      // Results banked while offline are replayed in order, oldest first.
      if (id) void flushPendingResults(id)
    })
  }, [deviceUuid, ensureUser])

  /**
   * The cached progression, with today's daily answered locally.
   *
   * `dailyCompleted` is the one cached field that expires: it is a statement
   * about a particular UTC day, and replaying yesterday's `true` locked the
   * player out of today's puzzle for a whole offline session — the one puzzle
   * an offline player is entitled to. The local record is keyed by day, so it
   * is the right answer here even though it only knows about this device.
   */
  const cachedProgress = useCallback((): ProgressResponse | null => {
    const cached = getProgressCache()
    if (!cached) return null
    return { ...cached, dailyCompleted: isDailyCompleted() }
  }, [])

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
        .catch(() => setProgress(cachedProgress()))
        .finally(() => setLoadingProgress(false))
    },
    [cachedProgress]
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
    // Registered on every session, with or without a user id: an install that
    // has never reached the server is exactly the one that needs these events,
    // because its first successful registration can only happen here.
    const drain = () => {
      void ensureUser().then((id) => {
        if (!id) return
        void flushPendingResults(id).then((outcome) => {
          // Only worth a round trip if the queue actually moved.
          if (outcome.sent > 0) void refreshProgress(id)
        })
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
  }, [ensureUser, refreshProgress])

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
      // have come back since the queue was filled, and an install that has
      // never registered gets its id here — and if it is still stuck, stop
      // rather than letting the unsynced pile grow.
      if (!state && shouldBlockOfflineStart(mode, pendingResultCount())) {
        const id = await ensureUser()
        if (id) await flushPendingResults(id)
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
    [userId, locale, ensureUser]
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
