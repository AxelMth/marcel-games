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
import { getCountriesByContinent, type Continent } from "@/lib/countries"
import { buildOfflineLevelParams } from "@/lib/game-logic"
import { ScreenHeader } from "@/components/screen-header"
import { ProfileModal } from "@/components/profile-modal"

const CONTINENT_OPTIONS: {
  id: Continent
  labelKey: string
  image: string
}[] = [
  { id: "EUROPE", labelKey: "continentSelect.EUROPE", image: "/images/europe.webp" },
  { id: "ASIA", labelKey: "continentSelect.ASIA", image: "/images/asia.webp" },
  { id: "AMERICAS", labelKey: "continentSelect.AMERICAS", image: "/images/americas.webp" },
  { id: "AFRICA", labelKey: "continentSelect.AFRICA", image: "/images/africa.webp" },
  { id: "OCEANIA", labelKey: "continentSelect.OCEANIA", image: "/images/oceania.webp" },
]

export function ContinentSelect() {
  const { t } = useLanguage()
  const {
    goHome,
    goToStats,
    setUserId,
    setGameFromLevel,
    setLoadingGame,
    setGameError,
    setProgress,
    setLoadingProgress,
    userId,
    progress,
    isLoadingGame,
    isLoadingProgress,
    gameError,
  } = useGameStore()
  const [profileOpen, setProfileOpen] = useState(false)
  const { launch } = useLaunch()
  const { loadLevel } = useLevelApi()
  const scrollRef = useRef<HTMLDivElement>(null)
  const firstCardRef = useRef<HTMLButtonElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (userId && progress == null) {
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
  }, [userId, progress, setProgress, setLoadingProgress])

  const getScrollStep = useCallback(() => {
    const card = firstCardRef.current
    if (!card) return 0
    return card.offsetWidth + 20
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
    setSelectedIndex(Math.max(0, Math.min(CONTINENT_OPTIONS.length - 1, index)))
  }, [getScrollStep])

  // Offline fallback: local deterministic level at the player's cached
  // progress for this continent, instead of an error screen.
  const startOffline = (continent: Continent) => {
    const level = progress?.continentLevels?.[continent] ?? 1
    setGameFromLevel(buildOfflineLevelParams("continent", level, continent))
  }

  const startContinentFromApi = async (continent: Continent) => {
    setLoadingGame(true)
    setGameError(null)
    try {
      const gameMode = "CONTINENTS" as const
      let uid = userId
      if (!uid) {
        uid = await launch(gameMode, continent)
        if (uid) setUserId(uid)
      }
      if (!uid) {
        startOffline(continent)
        return
      }
      const data = await loadLevel({
        userId: uid,
        gameMode,
        continent,
      })
      // The server tells us which level the player is on; the countries come
      // from the seeded generator, so the same level always holds the same
      // board. The server used to draw them anew on every request, which is
      // what made a level change under the player and orphaned their hints.
      setGameFromLevel(buildOfflineLevelParams("continent", data.level, continent))
    } catch (e) {
      console.error("Level load failed, starting offline:", e)
      startOffline(continent)
    } finally {
      setLoadingGame(false)
    }
  }

  return (
    <main
      className="mx-auto flex min-h-svh w-full max-w-xl flex-col px-0"
      style={{
        paddingTop: "max(1.5rem, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <ScreenHeader
        title="app.title"
        subtitle="app.subtitle"
        showBackButton
        onBack={goHome}
        onCogClick={() => goToStats()}
      />
      {gameError && (
        <p className="mb-2 px-5 text-center text-sm font-medium text-red-600">
          {gameError}
        </p>
      )}
      {isLoadingProgress && (
        <div className="mb-4 flex w-full items-center justify-center gap-2 px-5">
          <Loader2 className="h-5 w-5 animate-spin text-[#0f2b3c]" />
          <span className="text-sm font-medium text-[#0f2b3c]/80">
            {t("profile.loading")}
          </span>
        </div>
      )}
      {/* Carousel with arrows */}
      <div className="flex flex-1 items-center justify-center gap-2 px-5">
        <button
          type="button"
          onClick={() => scrollToIndex(selectedIndex - 1)}
          disabled={selectedIndex === 0}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#0f2b3c] shadow-md transition-opacity disabled:opacity-30"
          aria-label="Previous continent"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex w-[85%] max-w-md snap-x snap-mandatory gap-0 overflow-x-auto scrollbar-none"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {CONTINENT_OPTIONS.map((c, i) => {
            const level = progress?.continentLevels[c.id] ?? 1
            return (
              <button
                key={c.id}
                ref={i === 0 ? firstCardRef : undefined}
                onClick={() => startContinentFromApi(c.id)}
                disabled={isLoadingGame}
                className="mx-2.5 flex w-[75vw] max-w-xs shrink-0 snap-center flex-col items-center p-6 transition-transform duration-200 active:scale-[0.97]"
              >
                <div className="mb-4 flex h-32 w-32 items-center justify-center">
                  <Image
                    src={c.image}
                    alt={t(c.labelKey)}
                    width={128}
                    height={128}
                    className="object-contain drop-shadow-md"
                  />
                </div>
                <h2 className="mb-1 text-xl font-bold text-black">{t(c.labelKey)}</h2>
                <p className="text-sm font-medium text-black/70">{t("continentSelect.level")} {level}</p>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => scrollToIndex(selectedIndex + 1)}
          disabled={selectedIndex === CONTINENT_OPTIONS.length - 1}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#0f2b3c] shadow-md transition-opacity disabled:opacity-30"
          aria-label="Next continent"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
      <p className="mx-auto mt-4 max-w-sm px-4 text-center text-sm font-medium text-[#0f2b3c]/80">
        {t("continentSelect.scrollToSelect")}
      </p>
      <ProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        userId={userId}
      />
    </main>
  )
}
