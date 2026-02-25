"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useGameStore } from "@/lib/game-store"
import { useLanguage } from "@/components/language-provider"
import { useLaunch } from "@/hooks/use-launch"
import { useLevelApi } from "@/hooks/use-level"
import { getProgress } from "@/lib/api"
import { countries } from "@/lib/countries"
import { ScreenHeader } from "@/components/screen-header"

const modes = [
  {
    id: "world" as const,
    titleKey: "home.world",
    subtitleKey: "home.worldSubtitle",
    image: "/images/earth-logo.png"
  },
  {
    id: "continent" as const,
    titleKey: "home.continent",
    subtitleKey: "home.continentSubtitle",
    image: "/images/continent.png"
  },
  {
    id: "daily" as const,
    titleKey: "home.daily",
    subtitleKey: "home.dailySubtitle",
    image: "/images/daily.png"
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
  const firstCardRef = useRef<HTMLButtonElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (screen !== "home" || userId) return
    launch("WORLD", "").then((uid) => {
      if (uid) setUserId(uid)
    })
  }, [screen, userId, launch, setUserId])

  useEffect(() => {
    if (screen === "home" && userId) {
      setLoadingProgress(true)
      getProgress(userId)
        .then((p) =>
          setProgress({
            worldLevel: p.worldLevel,
            continentLevels: p.continentLevels ?? {},
            dailyCompleted: p.dailyCompleted,
          })
        )
        .catch(() => setProgress(null))
        .finally(() => setLoadingProgress(false))
    }
  }, [screen, userId, setProgress, setLoadingProgress])

  const getScrollStep = useCallback(() => {
    const card = firstCardRef.current
    if (!card) return 0
    const cardWidth = card.offsetWidth
    const gap = 20
    return cardWidth + gap
  }, [])

  const scrollToIndex = useCallback((index: number) => {
    const el = scrollRef.current
    if (!el) return
    const step = getScrollStep()
    if (!step) return
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
        setGameError(t("errors.couldNotStartGame"))
        return
      }
      const data = await loadLevel({
        userId: uid,
        gameMode,
        continent: "",
      })
      setGameFromLevel({
        mode,
        level: data.level,
        countryCodes: data.countryCodes,
        allCountries: countries,
      })
    } catch (e) {
      console.error(e)
        setGameError(e instanceof Error ? e.message : t("errors.failedToLoad"))
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
    <main className="flex min-h-svh flex-col items-center px-0 py-6 pb-20">
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
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex w-[82%] max-w-md snap-x snap-mandatory gap-0 overflow-x-auto overflow-y-visible scrollbar-none"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
            >
              {modes.map((mode, i) => {
                const worldLevel = progress?.worldLevel ?? 1
                const dailyDone = progress?.dailyCompleted ?? false
                const isDailyDisabled = mode.id === "daily" && dailyDone
                return (
                  <button
                    key={mode.id}
                    ref={i === 0 ? firstCardRef : undefined}
                    onClick={() => handleTap(mode.id)}
                    disabled={isLoadingGame || isDailyDisabled}
                    className="mx-2.5 flex w-[75vw] max-w-xs shrink-0 snap-center flex-col items-center p-6 transition-transform duration-200 active:scale-[0.97] disabled:opacity-60"
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
    </main>
  )
}
