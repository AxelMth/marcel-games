"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { ArrowLeft, Search, X } from "lucide-react"

import { useGameStore } from "@/lib/game-store"
import { countries, getCountryName } from "@/lib/countries"
import { normalizeCountryName } from "@/lib/game-logic"

import { GuidedTour } from "@/components/guided-tour"
import { HelpBubble } from "@/components/help-bubble"
import { useLanguage } from "@/components/language-provider"
import { useKeyboardOffset } from "@/hooks/use-keyboard-offset"
import { useNativeScrollLock } from "@/hooks/use-native-scroll-lock"

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
    startTimer,
  } = useGameStore()

  const [input, setInput] = useState("")
  const [showHintsHelpSheet, setShowHintsHelpSheet] = useState(false)
  const [hintsHelpSheetTab, setHintsHelpSheetTab] = useState<"hints" | "help">("hints")
  const [helpBubbleExpanded, setHelpBubbleExpanded] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [shouldShake, setShouldShake] = useState(false)
  // The clock is the player's score, so it must not run while they are still
  // staring at a loading map. The map settles either way — loaded or declared
  // unavailable — so this can never leave the timer stopped for good.
  const [boardReady, setBoardReady] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { t, tReplace, lang } = useLanguage()
  const keyboardOffset = useKeyboardOffset()
  // Only while the map is on screen: the lock belongs to the web view, so
  // holding it app-wide would take scrolling away from the stats history.
  useNativeScrollLock()

  useEffect(() => {
    if (!boardReady) return
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [tick, boardReady])

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
  }, [input])

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
        onSettled={() => {
          startTimer()
          setBoardReady(true)
        }}
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

      {/* Guess feedback toast - only for correct guesses. It rides above the
          search bar, so it has to clear the keyboard too: pressing Enter does
          not blur the input, and a fixed offset would leave the confirmation
          hidden behind the keyboard for its whole 2.5 s. */}
      {lastGuessResult?.type === "correct" && (
        <div
          className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2"
          style={{
            bottom: keyboardOffset > 0 ? `calc(5rem + ${keyboardOffset}px)` : "9rem",
            transition: "bottom 220ms ease-out",
          }}
        >
          <div className="rounded-xl bg-[#2ec4a0]/90 px-5 py-2.5 text-center text-sm font-bold text-white shadow-lg backdrop-blur-sm">
            {lastGuessResult.message}
          </div>
        </div>
      )}

      {/* Search bar - fixed at bottom, raised above the safe area and, when the
          keyboard is open, above the keyboard. Nothing else on the screen
          moves: the map stays exactly where the player left it.
          The shake animation also uses `transform`, so the lift has to be a
          `bottom` offset or the two would fight over the same property. */}
      <div
        data-tour="search-bar"
        className={`absolute left-0 right-0 z-10 p-4 pb-5 ${shouldShake ? "animate-search-bar-shake" : ""}`}
        style={{
          bottom:
            keyboardOffset > 0
              ? `calc(0.5rem + ${keyboardOffset}px)`
              : "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
          // keyboardWillShow fires as the keyboard starts animating in, so
          // matching its duration keeps the bar riding on top of it rather
          // than snapping up ahead of it.
          transition: "bottom 220ms ease-out",
        }}
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

      {/* Guided tour. Held back until the map has settled — highlighting a
          spinner would teach nothing — and while the keyboard is up, since it
          would cover the very element being pointed at. */}
      <GuidedTour
        tour="game"
        enabled={boardReady && keyboardOffset === 0 && !showHintsHelpSheet}
      />

      {/* Hints & Help bottom sheet */}
      <HintsHelpSheet
        open={showHintsHelpSheet}
        onOpenChange={setShowHintsHelpSheet}
        variant={hintsHelpSheetTab}
      />
    </div>
  )
}
