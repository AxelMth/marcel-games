"use client"

import { useCallback, useEffect } from "react"
import { useAppContext } from "@/lib/app-context"
import { useGameStore, type TileState } from "@/lib/game-store"
import { useWordclimbInterstitialAd } from "@/hooks/use-interstitial-ad"
import { Haptics, ImpactStyle } from "@capacitor/haptics"
import { t } from "@/lib/i18n"

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "DEL"],
]

function tileClass(state: TileState): string {
  switch (state) {
    case "correct": return "tile tile-correct"
    case "present": return "tile tile-present"
    case "absent": return "tile tile-absent"
    case "filled": return "tile tile-filled"
    default: return "tile tile-empty"
  }
}

function keyClass(state?: TileState): string {
  switch (state) {
    case "correct": return "key key-correct"
    case "present": return "key key-present"
    case "absent": return "key key-absent"
    default: return "key key-default"
  }
}

export function GameScreen() {
  const { language, setScreen } = useAppContext()
  const {
    currentLevel,
    currentLevelIndex,
    guesses,
    letterStates,
    isWon,
    isLost,
    showDefinition,
    addLetter,
    removeLetter,
    submitGuess,
    nextLevel,
    getDefinition,
  } = useGameStore()

  const { showAd } = useWordclimbInterstitialAd()

  const handleKeyPress = useCallback(
    (key: string) => {
      try { Haptics.impact({ style: ImpactStyle.Light }) } catch {}
      if (key === "ENTER") {
        submitGuess()
      } else if (key === "DEL") {
        removeLetter()
      } else {
        addLetter(key)
      }
    },
    [addLetter, removeLetter, submitGuess]
  )

  // Physical keyboard support
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Enter") handleKeyPress("ENTER")
      else if (e.key === "Backspace") handleKeyPress("DEL")
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase())
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleKeyPress])

  function handleNext() {
    showAd()
    nextLevel()
  }

  function handleBack() {
    setScreen("home")
  }

  if (!currentLevel) return null

  return (
    <main className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <button onClick={handleBack} className="text-muted-foreground text-sm">
          {"<"} {t("back", language)}
        </button>
        <h2 className="text-lg font-bold text-foreground">
          {t("level", language)} {currentLevelIndex + 1}
        </h2>
        <div className="w-12" />
      </header>

      {/* Grid */}
      <section className="flex flex-1 flex-col items-center justify-center gap-1.5 px-4">
        {guesses.map((row, ri) => (
          <div key={ri} className="flex gap-1.5">
            {row.map((tile, ci) => (
              <div key={ci} className={tileClass(tile.state)}>
                {tile.letter}
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* Result overlay */}
      {showDefinition && (
        <div className="mx-4 mb-3 rounded-xl bg-card p-4 text-center">
          <p className="mb-1 text-sm font-bold text-primary">
            {isWon ? t("correct", language) : `${t("answer", language)}: ${currentLevel.word.toUpperCase()}`}
          </p>
          <p className="text-xs text-muted-foreground">{getDefinition(language)}</p>
          <button
            onClick={handleNext}
            className="mt-3 rounded-lg bg-primary px-6 py-2 text-sm font-bold text-primary-foreground"
          >
            {t("next", language)}
          </button>
        </div>
      )}

      {/* Keyboard */}
      <section className="px-1.5 pb-4">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="mb-1.5 flex justify-center gap-1">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className={`${keyClass(letterStates[key])} ${
                  key === "ENTER" || key === "DEL" ? "min-w-[3.25rem] text-xs" : ""
                }`}
              >
                {key === "DEL" ? "\u232B" : key}
              </button>
            ))}
          </div>
        ))}
      </section>
    </main>
  )
}
