"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { ArrowLeft, Search, X } from "lucide-react"

import { useGameStore } from "@/lib/game-store"
import { countries, getCountryName } from "@/lib/countries"
import { normalizeCountryName } from "@/lib/game-logic"

import { HelpBubble } from "@/components/help-bubble"
import { useLanguage } from "@/components/language-provider"

import { GameIndicator } from "./game-indicator"
import { WorldMap } from "./world-map"
import { HintsHelpSheet } from "./hints-help-sheet"

export function GameScreen() {
  const {
    gameConfig,
    foundCountries,
    elapsedTime,
    lastGuessResult,
    highlightedCountry,
    goHome,
    submitGuess,
    clearLastGuess,
    tick,
  } = useGameStore()

  const [input, setInput] = useState("")
  const [showHintsHelpSheet, setShowHintsHelpSheet] = useState(false)
  const [hintsHelpSheetTab, setHintsHelpSheetTab] = useState<"hints" | "help">("hints")
  const [helpBubbleExpanded, setHelpBubbleExpanded] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [shouldShake, setShouldShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { t, tReplace, lang } = useLanguage()

  useEffect(() => {
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [tick])

  const suggestions = useMemo(() => {
    if (!input || input.length < 2) return []
    const normalized = normalizeCountryName(input)
    return countries
      .filter(
        (c) =>
          normalizeCountryName(c.nameEn).includes(normalized) ||
          normalizeCountryName(c.nameFr).includes(normalized)
      )
      .slice(0, 5)
  }, [input, lang])

  if (!gameConfig) return null

  const remaining = gameConfig.missingCountries.length - foundCountries.length
  const minutes = Math.floor(elapsedTime / 60)
  const seconds = elapsedTime % 60

  const label =
    gameConfig.mode === "daily"
      ? t("game.dailyChallenge")
      : gameConfig.mode === "continent"
        ? tReplace("game.continentLevel", {
            continent: gameConfig.continent
              ? t(`continentSelect.${gameConfig.continent}`)
              : "",
            level: gameConfig.level,
          })
        : tReplace("game.worldLevel", { level: gameConfig.level })

  const handleSubmit = (value?: string) => {
    const guessValue = value || input
    if (!guessValue.trim()) return
    const result = submitGuess(guessValue, lang)
    setInput("")
    setShowSuggestions(false)
    const isWrong = result && result.type !== "correct"
    if (isWrong) {
      setShouldShake(true)
    } else {
      setTimeout(() => clearLastGuess(), 2500)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit()
    }
  }

  return (
    <div className="relative h-svh w-full overflow-hidden">
      {/* Full-page Mapbox map */}
      <WorldMap
        missingCountries={gameConfig.missingCountries}
        foundCountries={foundCountries}
        highlightedCountry={highlightedCountry}
        continent={gameConfig.continent}
      />

      {/* --- OVERLAYS ON TOP OF MAP --- */}

      {/* Top bar: back + label (safe area so tappable on notched devices) */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-3"
        style={{
          paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))",
          paddingLeft: "max(0.75rem, env(safe-area-inset-left, 0px))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right, 0px))",
        }}
      >
        <button
          onClick={goHome}
          className="pointer-events-auto flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white/80 shadow-md backdrop-blur-sm transition-colors active:bg-white"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-[#0f2b3c]" />
        </button>
        <span className="pointer-events-none rounded-full bg-white/80 px-4 py-1.5 text-sm font-bold text-[#0f2b3c] shadow-md backdrop-blur-sm">
          {label}
        </span>
        <div className="min-h-[44px] min-w-[44px]" aria-hidden />
      </div>

      {/* Missing countries banner (below top bar + safe area) */}
      <GameIndicator
        remaining={remaining}
        foundCount={foundCountries.length}
        totalCount={gameConfig.missingCountries.length}
        minutes={minutes}
        seconds={seconds}
      />

      {/* Help/Hints bubble: first tap expands to 2 options, each opens sheet */}
      <HelpBubble
        expanded={helpBubbleExpanded}
        onFirstClick={() => setHelpBubbleExpanded(true)}
        onClose={() => setHelpBubbleExpanded(false)}
        onSelectHints={() => {
          setHelpBubbleExpanded(false)
          setHintsHelpSheetTab("hints")
          setShowHintsHelpSheet(true)
        }}
        onSelectHelp={() => {
          setHelpBubbleExpanded(false)
          setHintsHelpSheetTab("help")
          setShowHintsHelpSheet(true)
        }}
      />

      {/* Guess feedback toast - only for correct guesses */}
      {lastGuessResult?.type === "correct" && (
        <div className="pointer-events-none absolute bottom-36 left-1/2 z-20 -translate-x-1/2">
          <div className="rounded-xl bg-[#2ec4a0]/90 px-5 py-2.5 text-center text-sm font-bold text-white shadow-lg backdrop-blur-sm">
            {lastGuessResult.message}
          </div>
        </div>
      )}

      {/* Search bar - fixed at bottom, raised above safe area */}
      <div
        className={`absolute left-0 right-0 z-10 p-4 pb-5 ${shouldShake ? "animate-search-bar-shake" : ""}`}
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
        onAnimationEnd={() => {
          if (shouldShake) {
            setShouldShake(false)
            clearLastGuess()
          }
        }}
      >
        {/* Autocomplete suggestions above search */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mb-2 overflow-hidden rounded-xl bg-white shadow-xl">
            {suggestions.map((country) => (
              <button
                key={country.code}
                onPointerDown={() => handleSubmit(getCountryName(country, lang))}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[#e0f4f8] active:bg-[#d4eef4]"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-[#0f2b3c]">
                  <img
                    src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${country.codeAlpha2}.svg`}
                    alt=""
                    className="h-4 w-5 shrink-0 rounded-sm object-cover"
                  />
                  {getCountryName(country, lang)}
                </span>
                <span className="text-xs font-medium text-[#3a6b7e]">
                  {country.continent}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#3a6b7e]" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setShowSuggestions(e.target.value.length >= 2)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(input.length >= 2)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={t("game.enterCountryName")}
            className="w-full rounded-3xl bg-white py-4 pl-12 pr-10 text-base font-medium text-[#0f2b3c] shadow-xl outline-none ring-2 ring-transparent transition-all placeholder:text-[#3a6b7e]/50 focus:ring-[#1a8fb5]"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
          />
          {input && (
            <button
              onClick={() => {
                setInput("")
                setShowSuggestions(false)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#3a6b7e] hover:bg-[#e0f4f8]"
              aria-label="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Hints & Help bottom sheet */}
      <HintsHelpSheet
        open={showHintsHelpSheet}
        onOpenChange={setShowHintsHelpSheet}
        variant={hintsHelpSheetTab}
      />
    </div>
  )
}
