"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Clock, Target, Lightbulb, Home, ArrowRight, Star } from "lucide-react"
import { useGameStore } from "@/lib/game-store"
import { useLanguage } from "@/components/language-provider"
import { useLevelApi } from "@/hooks/use-level"
import { useInterstitialAd } from "@/hooks/use-interstitial-ad"
import { NUMBER_OF_LEVELS_BETWEEN_ADS } from "@/lib/ad-constants"
import { getStars } from "@/lib/stars"
import { setProgressCache } from "@/lib/progress-cache"

const CARD_DELAY_MS = 120
const MODE_LABEL_DELAY_MS = 500
const ACTIONS_DELAY_MS = 600

const MODE_TO_GAME_MODE = {
  world: "WORLD" as const,
  continent: "CONTINENTS" as const,
  daily: "LEVEL_OF_THE_DAY" as const,
}

export function SuccessScreen() {
  const { t } = useLanguage()
  const {
    gameConfig,
    foundCountries,
    attempts,
    elapsedTime,
    hintsUsed,
    goHome,
    nextLevel,
    userId,
    progress,
    setProgress,
    setPendingNextLevel,
    worldLevelWasFromApiLoad,
    clearWorldLevelWasFromApiLoad,
  } = useGameStore()
  const { finishLevel } = useLevelApi()
  const { preload, show } = useInterstitialAd()
  const hasPostedFinish = useRef(false)
  const screen = useGameStore((s) => s.screen)

  useEffect(() => {
    if (screen !== "success") hasPostedFinish.current = false
  }, [screen])

  useEffect(() => {
    if (!gameConfig || !userId || hasPostedFinish.current) return
    hasPostedFinish.current = true
    const gameMode = MODE_TO_GAME_MODE[gameConfig.mode]
    const countryCodes = foundCountries.map((c) => c.code)
    // WORLD and LEVEL_OF_THE_DAY use WORLD as continent; CONTINENTS uses the selected continent
    const continent =
      gameConfig.mode === "world" || gameConfig.mode === "daily"
        ? "WORLD"
        : (gameConfig.continent ?? "WORLD")
    finishLevel({
      userId,
      attempts,
      timeSpent: elapsedTime,
      hintsUsed,
      gameMode,
      continent,
      countryCodes,
    })
      .then((res) => {
        setPendingNextLevel(res.nextLevel, res.nextCountryCodes)
        const current = progress ?? {
          worldLevel: 1,
          continentLevels: {} as Record<string, number>,
          dailyCompleted: false,
        }
        let updated: { worldLevel: number; continentLevels: Record<string, number>; dailyCompleted: boolean }
        if (gameConfig.mode === "world") {
          updated = {
            worldLevel: res.nextLevel,
            continentLevels: current.continentLevels ?? {},
            dailyCompleted: current.dailyCompleted ?? false,
          }
        } else if (gameConfig.mode === "continent" && gameConfig.continent) {
          updated = {
            worldLevel: current.worldLevel ?? 1,
            continentLevels: { ...(current.continentLevels ?? {}), [gameConfig.continent]: res.nextLevel },
            dailyCompleted: current.dailyCompleted ?? false,
          }
        } else {
          updated = {
            worldLevel: current.worldLevel ?? 1,
            continentLevels: current.continentLevels ?? {},
            dailyCompleted: true,
          }
        }
        setProgress(updated)
        setProgressCache(updated)
      })
      .catch((e) => console.error("Finish level failed:", e))
  }, [gameConfig, userId, progress, foundCountries, attempts, elapsedTime, hintsUsed, finishLevel, setPendingNextLevel, setProgress])

  // Preload interstitial when success screen mounts (for "Next Level" tap)
  useEffect(() => {
    if (gameConfig?.mode !== "daily") preload()
  }, [gameConfig?.mode, preload])

  const handleNextLevel = async () => {
    if (!gameConfig) return
    if (gameConfig.mode === "world" && worldLevelWasFromApiLoad) {
      clearWorldLevelWasFromApiLoad()
      nextLevel()
      return
    }
    const shouldShowAd =
      gameConfig &&
      gameConfig.mode !== "daily" &&
      gameConfig.level % NUMBER_OF_LEVELS_BETWEEN_ADS === 0
    if (shouldShowAd) {
      try {
        await show()
      } finally {
        nextLevel()
      }
    } else {
      nextLevel()
    }
  }

  if (!gameConfig) return null

  const minutes = Math.floor(elapsedTime / 60)
  const seconds = elapsedTime % 60

  const stars = getStars(attempts, foundCountries.length, hintsUsed)
  const accuracy =
    attempts > 0
      ? Math.round((foundCountries.length / attempts) * 100)
      : 100
  const ratingLabels: Record<number, string> = {
    1: t("success.wellDone"),
    2: t("success.greatJob"),
    3: t("success.perfect"),
  }
  const rating = { stars, label: ratingLabels[stars] ?? t("success.wellDone") }
  const canNextLevel = gameConfig.mode !== "daily"

  const [visibleCards, setVisibleCards] = useState([false, false, false, false])
  const [modeLabelVisible, setModeLabelVisible] = useState(false)
  const [actionsVisible, setActionsVisible] = useState(false)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    ;[0, 1, 2, 3].forEach((i) => {
      timers.push(
        setTimeout(() => {
          setVisibleCards((prev) => {
            const next = [...prev]
            next[i] = true
            return next
          })
        }, i * CARD_DELAY_MS)
      )
    })
    timers.push(setTimeout(() => setModeLabelVisible(true), MODE_LABEL_DELAY_MS))
    timers.push(setTimeout(() => setActionsVisible(true), ACTIONS_DELAY_MS))
    return () => timers.forEach((t) => clearTimeout(t))
  }, [])

  const animateClass = "transition-all duration-300 ease-out"
  const hiddenClass = "translate-y-2 opacity-0"
  const visibleClass = "translate-y-0 opacity-100"

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <Image
        src="/images/earthunt.png"
        alt="EartHunt"
        width={80}
        height={80}
        className="mb-4 drop-shadow-lg"
      />

      {/* Rating */}
      <h1 className="mb-2 text-3xl font-extrabold text-[#0f2b3c]">
        {rating.label}
      </h1>

      {/* Stars */}
      <div className="mb-6 flex gap-2">
        {[1, 2, 3].map((star) => {
          const earned = star <= rating.stars
          return (
            <div
              key={star}
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                earned
                  ? "bg-[#f0a830] text-white"
                  : "bg-white/40 text-[#b0d8e4]"
              }`}
            >
              <Star
                className="h-6 w-6"
                fill={earned ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={1.5}
              />
            </div>
          )
        })}
      </div>

      {/* Stats cards (staggered entrance) */}
      <div className="mx-auto mb-8 grid w-full max-w-sm grid-cols-2 gap-3">
        <div
          className={`flex flex-col items-center rounded-2xl bg-white/80 p-4 shadow-md backdrop-blur-sm ${animateClass} ${
            visibleCards[0] ? visibleClass : hiddenClass
          }`}
        >
          <Target className="mb-2 h-6 w-6 text-[#1a8fb5]" />
          <span className="text-2xl font-extrabold text-[#0f2b3c]">
            {foundCountries.length}
          </span>
          <span className="text-xs font-medium text-[#3a6b7e]">
            {t("success.countriesFound")}
          </span>
        </div>

        <div
          className={`flex flex-col items-center rounded-2xl bg-white/80 p-4 shadow-md backdrop-blur-sm ${animateClass} ${
            visibleCards[1] ? visibleClass : hiddenClass
          }`}
        >
          <Clock className="mb-2 h-6 w-6 text-[#f0a830]" />
          <span className="text-2xl font-extrabold text-[#0f2b3c]">
            {minutes}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="text-xs font-medium text-[#3a6b7e]">
            {t("success.totalTime")}
          </span>
        </div>

        <div
          className={`flex flex-col items-center rounded-2xl bg-white/80 p-4 shadow-md backdrop-blur-sm ${animateClass} ${
            visibleCards[2] ? visibleClass : hiddenClass
          }`}
        >
          <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#6d9581]/20 text-xs font-bold text-[#6d9581]">
            %
          </div>
          <span className="text-2xl font-extrabold text-[#0f2b3c]">
            {accuracy}%
          </span>
          <span className="text-xs font-medium text-[#3a6b7e]">{t("success.accuracy")}</span>
        </div>

        <div
          className={`flex flex-col items-center rounded-2xl bg-white/80 p-4 shadow-md backdrop-blur-sm ${animateClass} ${
            visibleCards[3] ? visibleClass : hiddenClass
          }`}
        >
          <Lightbulb className="mb-2 h-6 w-6 text-[#e54d4d]" />
          <span className="text-2xl font-extrabold text-[#0f2b3c]">
            {hintsUsed}
          </span>
          <span className="text-xs font-medium text-[#3a6b7e]">
            {t("success.hintsUsed")}
          </span>
        </div>
      </div>

      {/* Mode / Level label (animated) */}
      <p
        className={`mb-6 text-sm font-semibold text-[#0f2b3c]/60 ${animateClass} ${
          modeLabelVisible ? visibleClass : hiddenClass
        }`}
      >
        {gameConfig.mode === "daily"
          ? t("game.dailyChallenge")
          : gameConfig.mode === "continent" && gameConfig.continent
            ? `${t(`continentSelect.${gameConfig.continent}`)} - ${t("continentSelect.level")} ${gameConfig.level}`
            : `${t("home.world")} - ${t("continentSelect.level")} ${gameConfig.level}`}
      </p>

      {/* Actions (animated) */}
      <div
        className={`flex w-full max-w-sm flex-col gap-3 ${animateClass} ${
          actionsVisible ? visibleClass : hiddenClass
        }`}
      >
        <button
          onClick={goHome}
          className="flex items-center justify-center gap-2 rounded-2xl bg-white/80 py-4 text-base font-bold text-[#0f2b3c] shadow-md backdrop-blur-sm transition-all hover:bg-white active:scale-[0.98]"
        >
          <Home className="h-5 w-5" />
          {t("success.backToHome")}
        </button>
        {canNextLevel && (
          <button
            onClick={handleNextLevel}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#1a8fb5] py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-[#157a9d] active:scale-[0.98]"
          >
            {t("success.nextLevel")}
            <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </main>
  )
}
