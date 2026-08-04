"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useGameStore } from "@/lib/game-store"
import { useLanguage } from "@/components/language-provider"
import { useLaunch } from "@/hooks/use-launch"
import { useLevelApi } from "@/hooks/use-level"
import { getProgress } from "@/lib/api"
import { getProgressCache, setProgressCache } from "@/lib/progress-cache"
import { countries } from "@/lib/countries"
import { buildOfflineLevelParams } from "@/lib/game-logic"
import { ScreenHeader } from "@/components/screen-header"
import { GuidedTour } from "@/components/guided-tour"

const modes = [
  {
    id: "world" as const,
    titleKey: "home.world",
    subtitleKey: "home.worldSubtitle",
    image: "/images/earth-logo.webp"
  },
  {
    id: "continent" as const,
    titleKey: "home.continent",
    subtitleKey: "home.continentSubtitle",
    image: "/images/continent.webp"
  },
  {
    id: "daily" as const,
    titleKey: "home.daily",
    subtitleKey: "home.dailySubtitle",
    image: "/images/daily.webp"
  },
]

const MODE_TO_GAME_MODE = {
  world: "WORLD" as const,
  continent: "CONTINENTS" as const,
  daily: "LEVEL_OF_THE_DAY" as const,
}

export function HomeScreen() {
  const { t } = useLanguage()
  const {
    goToContinentSelect,
    goToStats,
    setUserId,
    setGameFromLevel,
    setLoadingGame,
    setGameError,
    setProgress,
    setLoadingProgress,
    userId,
    isLoadingGame,
    isLoadingProgress,
    gameError,
    progress,
    screen,
  } = useGameStore()
  const { launch } = useLaunch()
  const { loadLevel } = useLevelApi()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (screen !== "home" || userId) return
    launch("WORLD", "").then((uid) => {
      if (uid) setUserId(uid)
    })
  }, [screen, userId, launch, setUserId])

  useEffect(() => {
    if (screen === "home" && userId) {
      if (progress != null) {
        return
      }
      const cached = getProgressCache()
      if (cached) {
        setProgress({
          worldLevel: cached.worldLevel,
          continentLevels: cached.continentLevels ?? {},
          dailyCompleted: cached.dailyCompleted,
        })
        getProgress(userId)
          .then((p) => {
            const next = {
              worldLevel: p.worldLevel,
              continentLevels: p.continentLevels ?? {},
              dailyCompleted: p.dailyCompleted,
            }
            setProgress(next)
            setProgressCache(next)
          })
          .catch(() => {})
        return
      }
      setLoadingProgress(true)
      getProgress(userId)
        .then((p) => {
          const next = {
            worldLevel: p.worldLevel,
            continentLevels: p.continentLevels ?? {},
            dailyCompleted: p.dailyCompleted,
          }
          setProgress(next)
          setProgressCache(next)
        })
        .catch(() => setProgress(null))
        .finally(() => setLoadingProgress(false))
    }
  }, [screen, userId, progress, setProgress, setLoadingProgress])

  // Each card is exactly as wide as the scroll port, so one page == one card.
  // Sizing the cards in `vw` instead made them wider than the port (the two
  // arrows eat into it), which is what pushed the mode subtitle off-screen.
  const getScrollStep = useCallback(() => scrollRef.current?.clientWidth ?? 0, [])

  const scrollToIndex = useCallback((index: number) => {
    const el = scrollRef.current
    const step = getScrollStep()
    if (!el || !step) return
    el.scrollTo({ left: index * step, behavior: "smooth" })
    setSelectedIndex(index)
  }, [getScrollStep])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    const step = getScrollStep()
    if (!el || !step) return
    const index = Math.round(el.scrollLeft / step)
    setSelectedIndex(Math.max(0, Math.min(modes.length - 1, index)))
  }, [getScrollStep])

  // Offline fallback: generate the level locally instead of blocking the
  // player behind an error. Same deterministic generator, same store action.
  const startOffline = (mode: "world" | "daily") => {
    const level = mode === "world" ? (progress?.worldLevel ?? 1) : 1
    setGameFromLevel(buildOfflineLevelParams(mode, level))
  }

  const startFromApi = async (mode: "world" | "daily") => {
    setLoadingGame(true)
    setGameError(null)
    try {
      const gameMode = MODE_TO_GAME_MODE[mode]
      let uid = userId
      if (!uid) {
        uid = await launch(gameMode, "")
        if (uid) setUserId(uid)
      }
      if (!uid) {
        startOffline(mode)
        return
      }
      const data = await loadLevel({
        userId: uid,
        gameMode,
        continent: "",
      })
      // A level with nothing to find is won the instant it opens. The daily
      // used to arrive that way whenever the server had no puzzle stored for
      // today, so never trust an empty set — generate one locally instead.
      if (data.countryCodes.length === 0) {
        startOffline(mode)
        return
      }
      setGameFromLevel({
        mode,
        level: data.level,
        countryCodes: data.countryCodes,
        allCountries: countries,
      })
    } catch (e) {
      console.error("Level load failed, starting offline:", e)
      startOffline(mode)
    } finally {
      setLoadingGame(false)
    }
  }

  const handleTap = (id: "world" | "continent" | "daily") => {
    if (id === "daily" && progress?.dailyCompleted) return
    switch (id) {
      case "world":
        startFromApi("world")
        break
      case "continent":
        goToContinentSelect()
        break
      case "daily":
        startFromApi("daily")
        break
    }
  }

  return (
    // max-w-xl keeps the phone-first layout from stretching into a mostly-empty
    // column on iPad; mx-auto centres it so the width reads as deliberate.
    // The inset lives inside min-h-svh (border-box), so the page still measures
    // exactly one viewport and nothing scrolls behind the notch.
    <main
      className="mx-auto flex min-h-svh w-full max-w-xl flex-col items-center px-0 pb-20"
      style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top, 0px))" }}
    >
      <ScreenHeader title="app.title" subtitle="app.subtitle" onCogClick={() => goToStats()} />
      {gameError && (
        <p className="mb-4 px-5 text-center text-sm font-medium text-red-600">
          {gameError}
        </p>
      )}
      <div className="flex flex-1 w-full flex-col items-center justify-center">
        {isLoadingProgress ? (
          <div className="flex items-center justify-center gap-2 px-5">
            <Loader2 className="h-5 w-5 animate-spin text-[#0f2b3c]" />
            <span className="text-sm font-medium text-[#0f2b3c]/80">
              {t("profile.loading")}
            </span>
          </div>
        ) : (
          /* Carousel with arrows */
          <div className="flex w-full items-center justify-center gap-2 px-4">
            <button
              type="button"
              onClick={() => scrollToIndex(selectedIndex - 1)}
              disabled={selectedIndex === 0}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#0f2b3c] shadow-md transition-opacity disabled:opacity-30"
              aria-label="Previous mode"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            {/* min-w-0 lets this flex child shrink below its content width;
                without it the scroll port overflows past the arrows. */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex min-w-0 max-w-md flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-visible scrollbar-none"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
            >
              {modes.map((mode, i) => {
                const worldLevel = progress?.worldLevel ?? 1
                const dailyDone = progress?.dailyCompleted ?? false
                const isDailyDisabled = mode.id === "daily" && dailyDone
                return (
                  <button
                    key={mode.id}
                    data-tour={i === selectedIndex ? "mode-card" : undefined}
                    onClick={() => handleTap(mode.id)}
                    disabled={isLoadingGame || isDailyDisabled}
                    className="flex w-full shrink-0 snap-center flex-col items-center px-4 py-6 transition-transform duration-200 active:scale-[0.97] disabled:opacity-60"
                  >
                    <div className="mb-4 flex h-28 w-28 items-center justify-center">
                      <Image
                        src={mode.image}
                        alt={t(mode.titleKey)}
                        width={112}
                        height={112}
                        className="object-contain drop-shadow-md"
                      />
                    </div>
                    <h2 className="mb-1 text-center text-xl font-bold text-black">{t(mode.titleKey)}</h2>
                    <p className="min-h-[2.5rem] w-full text-center text-sm font-medium text-black/80">
                      {mode.id === "daily" && dailyDone
                        ? t("home.doneForToday")
                        : t(mode.subtitleKey)}
                    </p>
                    {mode.id === "world" && (
                      <p className="mt-0.5 w-full text-center text-xs font-medium text-black/60">
                        {t("continentSelect.level")} {worldLevel}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => scrollToIndex(selectedIndex + 1)}
              data-tour="mode-next"
              disabled={selectedIndex === modes.length - 1}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#0f2b3c] shadow-md transition-opacity disabled:opacity-30"
              aria-label="Next mode"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>
      <p
        className="fixed bottom-0 left-0 right-0 py-4 text-center text-sm font-medium text-[#0f2b3c]/80"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
      >
        {t("home.scrollToSelect")}
      </p>

      {/* Only once the carousel is on screen: the tour measures its target, and
          a card that has not been laid out yet has no rectangle to point at. */}
      <GuidedTour tour="home" enabled={screen === "home" && !isLoadingProgress} />
    </main>
  )
}
