"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Lightbulb, HelpCircle } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { t } from "@/lib/i18n"
import { getDefinition } from "@/lib/data/definitions"
import { ScreenHeader } from "@marcel-games/ui"
import { useKeyboardOffset } from "@marcel-games/lib"
import {
  setClassicProgress,
  getClassicProgress,
  setDailyCompleted,
  createGameState,
  createLocalGameState,
  levelFromApi,
  toBackendGameMode,
  toBackendLocale,
} from "@/lib/game-store"
import type { GameState } from "@/lib/game-store"
import { postFinishLevel } from "@/lib/api"
import { enqueuePendingResult } from "@/lib/pending-results"
import { WordRow } from "./word-row"
import { HintsModal } from "./hints-modal"
import { HelpModal } from "./help-modal"
import { SuccessModal } from "./success-modal"

export function GameScreen() {
  const { locale, gameState, setGameState, goHome, userId, setProgress } = useApp()
  const [input, setInput] = useState("")
  const [showHints, setShowHints] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const ladderRef = useRef<HTMLDivElement>(null)
  const keyboardOffset = useKeyboardOffset()

  const state = gameState!
  const level = state.level
  const { beginWord, endWord, wordLadder } = level

  // Full ladder: endWord, ...reversed(wordLadder), beginWord
  // Display: endWord at top, beginWord at bottom
  // User finds intermediate words from beginWord side going up

  const currentTargetWord = wordLadder[state.currentWordIndex]
  const wordsLeft = wordLadder.length - state.currentWordIndex

  // The next puzzle, as the server hands it back when a level is banked. Held
  // here so the "next level" tap does not have to make a second round trip.
  const nextLevelRef = useRef<GameState["level"] | null>(null)

  /**
   * Records a finished level: locally first, so progression survives with no
   * network, then against the API. A result that cannot be sent is queued and
   * replayed at the next launch — the player never waits on it.
   */
  const bankCompletion = useCallback(
    (finished: GameState) => {
      if (finished.mode === "classic") {
        setClassicProgress(getClassicProgress() + 1)
      }
      if (finished.mode === "daily") {
        setDailyCompleted()
      }

      const result = {
        attempts: finished.attempts,
        timeSpent: Math.max(0, Math.floor((Date.now() - finished.startTime) / 1000)),
        hintsUsed: finished.hintsUsed,
        gameMode: toBackendGameMode(finished.mode),
        locale: toBackendLocale(locale),
        beginWord: finished.level.beginWord,
        endWord: finished.level.endWord,
        wordLadder: finished.level.wordLadder,
      }

      if (!userId) {
        enqueuePendingResult(result)
        return
      }

      postFinishLevel({ userId, ...result })
        .then((response) => {
          nextLevelRef.current = levelFromApi({
            level: response.nextLevel,
            beginWord: response.nextBeginWord,
            endWord: response.nextEndWord,
            wordLadder: response.nextWordLadder,
          })
          if (response.stats) {
            setProgress((p) => (p ? { ...p, stats: response.stats } : p))
          }
        })
        .catch(() => {
          enqueuePendingResult(result)
        })
    },
    [locale, userId, setProgress]
  )

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return

    const guess = input.trim().toLowerCase()
    const target = currentTargetWord.toLowerCase()

    if (guess === target) {
      const newFoundWords = [...state.foundWords]
      newFoundWords[state.currentWordIndex] = true

      const nextIndex = state.currentWordIndex + 1
      const isComplete = nextIndex >= wordLadder.length

      const newState: GameState = {
        ...state,
        foundWords: newFoundWords,
        currentWordIndex: nextIndex,
        attempts: state.attempts + 1,
        feedback: "correct",
        isComplete,
      }

      setGameState(newState)
      setInput("")

      if (isComplete) {
        bankCompletion(newState)
        setTimeout(() => setShowSuccess(true), 600)
      }
    } else {
      // Check if already found
      const alreadyFound = state.foundWords.some(
        (found, idx) => found && wordLadder[idx].toLowerCase() === guess
      )

      setGameState({
        ...state,
        attempts: state.attempts + 1,
        feedback: alreadyFound ? "already" : "wrong",
      })
    }

    // Clear feedback after a delay
    setTimeout(() => {
      setGameState((prev) => (prev ? { ...prev, feedback: null } : prev))
    }, 1500)
  }, [input, currentTargetWord, state, wordLadder, setGameState, bankCompletion])

  const handleHint = useCallback(
    (type: "firstLetter" | "fullWord") => {
      if (state.isComplete) return

      if (type === "firstLetter") {
        setInput(currentTargetWord[0])
        setGameState({ ...state, hintsUsed: state.hintsUsed + 1 })
      } else {
        // Reveal full word
        const newFoundWords = [...state.foundWords]
        newFoundWords[state.currentWordIndex] = true
        const nextIndex = state.currentWordIndex + 1
        const isComplete = nextIndex >= wordLadder.length

        const newState: GameState = {
          ...state,
          foundWords: newFoundWords,
          currentWordIndex: nextIndex,
          hintsUsed: state.hintsUsed + 1,
          isComplete,
        }

        setGameState(newState)
        setInput("")

        if (isComplete) {
          bankCompletion(newState)
          setTimeout(() => setShowSuccess(true), 600)
        }
      }
      setShowHints(false)
    },
    [state, currentTargetWord, wordLadder, setGameState, bankCompletion]
  )

  // Scroll ladder to show current word
  useEffect(() => {
    if (ladderRef.current) {
      const currentEl = ladderRef.current.querySelector("[data-current]")
      if (currentEl) {
        currentEl.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [state.currentWordIndex])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const modeLabel =
    state.mode === "classic"
      ? `${t(locale, "level")} ${getClassicProgress() + 1}`
      : t(locale, "dailyChallenge")

  return (
    // h-svh with no padding of its own: the box measures exactly one
    // viewport, so the input bar below can never be pushed off screen. The top
    // bar and the input bar carry the safe-area insets themselves — same
    // division of labour as earthunt's game screen.
    <div className="relative flex h-svh flex-col overflow-hidden bg-[#F8F8F8]">
      {/* Top bar. The shared header keeps the mode label centred against the
          screen: laid out as justify-between it drifted left, because the two
          buttons on the right are far wider than the lone back arrow. */}
      <div
        className="z-10 border-b border-[#E0E0E0] bg-[#F8F8F8] py-3"
        style={{
          paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))",
          paddingLeft: "max(0rem, env(safe-area-inset-left, 0px))",
          paddingRight: "max(0rem, env(safe-area-inset-right, 0px))",
        }}
      >
        <ScreenHeader
          className="px-4 text-[#0A3D62]"
          title={modeLabel}
          titleClassName="text-sm"
          onBack={goHome}
          backLabel={t(locale, "backToMenu")}
          backClassName="text-[#1D70A2] active:bg-[#1D70A2]/10"
          actions={
            <>
              <button
                onClick={() => setShowHints(true)}
                className="flex items-center gap-1 rounded-full bg-[#1D70A2]/10 px-2.5 py-1 text-xs font-semibold text-[#1D70A2]"
              >
                <Lightbulb size={14} />
                {t(locale, "hints")}
              </button>
              <button
                onClick={() => setShowHelp(true)}
                className="text-[#50555C]"
                aria-label="Help"
              >
                <HelpCircle size={20} />
              </button>
            </>
          }
        />
      </div>

      {/* Words left banner */}
      {!state.isComplete && (
        <div className="px-4 py-2 bg-[#EDF7FC] text-center">
          <span className="text-xs font-semibold text-[#1D70A2]">
            {wordsLeft} {wordsLeft === 1 ? t(locale, "wordLeft") : t(locale, "wordsLeft")}
          </span>
        </div>
      )}

      {/* Word ladder display */}
      <div ref={ladderRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="flex flex-col items-center gap-3">
          {/* End word at top */}
          <WordRow
            word={endWord}
            state="given"
            label={locale === "en" ? "END" : "FIN"}
          />

          {/* Connector */}
          <div className="w-0.5 h-3 bg-[#D0D0D0]" />

          {/* Intermediate words (reversed so end is at top) */}
          {[...wordLadder].reverse().map((word, reverseIdx) => {
            const actualIdx = wordLadder.length - 1 - reverseIdx
            const isFound = state.foundWords[actualIdx]
            const isCurrent = actualIdx === state.currentWordIndex && !state.isComplete

            return (
              <div key={`word-${actualIdx}`} className="flex flex-col items-center gap-3">
                <div data-current={isCurrent || undefined}>
                  <WordRow
                    word={word}
                    state={isFound ? "found" : isCurrent ? "current" : "hidden"}
                    highlight={isCurrent}
                    typed={isCurrent ? input : undefined}
                  />
                </div>
                <div className="w-0.5 h-3 bg-[#D0D0D0]" />
              </div>
            )
          })}

          {/* Begin word at bottom */}
          <WordRow
            word={beginWord}
            state="given"
            label={locale === "en" ? "START" : "DEBUT"}
          />
        </div>

        {/* Definition card */}
        {!state.isComplete && currentTargetWord && (
          <div className="mt-6 mx-auto max-w-sm rounded-2xl bg-[rgba(255,255,255,0.95)] border border-[#E0E0E0] p-4 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1D70A2] mb-1 block">
              {t(locale, "definition")}
            </span>
            <p className="text-sm text-[#333] leading-relaxed">
              {getDefinition(currentTargetWord, locale)}
            </p>
          </div>
        )}
      </div>

      {/* Feedback toast */}
      {state.feedback && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 bottom-24 px-4 py-2 rounded-full text-sm font-bold shadow-lg z-20 transition-all animate-in fade-in slide-in-from-bottom-2 ${
            state.feedback === "correct"
              ? "bg-[#2E8B57] text-[#F8F8F8]"
              : state.feedback === "wrong"
                ? "bg-[#DC3545] text-[#F8F8F8]"
                : "bg-[#D4782F] text-[#F8F8F8]"
          }`}
        >
          {state.feedback === "correct"
            ? t(locale, "correct")
            : state.feedback === "wrong"
              ? t(locale, "wrong")
              : t(locale, "alreadyFound")}
        </div>
      )}

      {/* Input bar fixed at bottom */}
      {!state.isComplete && (
        <div
          className="border-t border-[#E0E0E0] bg-[#F8F8F8] px-4 py-3 z-10"
          style={{
            marginBottom: keyboardOffset > 0 ? `${keyboardOffset}px` : undefined,
            // The home-indicator inset is pointless once the keyboard covers
            // that strip, so it only applies when the keyboard is down.
            paddingBottom:
              keyboardOffset > 0
                ? "0.75rem"
                : "max(0.75rem, env(safe-area-inset-bottom, 0px))",
            paddingLeft: "max(1rem, env(safe-area-inset-left, 0px))",
            paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
            // keyboardWillShow fires as the keyboard starts animating in;
            // matching its duration keeps the bar riding on top of it.
            transition: "margin-bottom 220ms ease-out",
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t(locale, "enterWord")}
              className="flex-1 rounded-xl border-2 border-[#D0D0D0] bg-[#FFFFFF] px-4 py-2.5 text-base font-semibold text-[#0A3D62] placeholder:text-[#A0A0A0] focus:border-[#1D70A2] focus:outline-none transition-colors"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck="false"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#1D70A2] px-5 py-2.5 text-sm font-bold text-[#F8F8F8] shadow-sm transition-colors hover:bg-[#165d8a] active:bg-[#124d73]"
            >
              {t(locale, "submit")}
            </button>
          </form>
        </div>
      )}

      {/* Modals */}
      {showHints && (
        <HintsModal onClose={() => setShowHints(false)} onHint={handleHint} />
      )}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showSuccess && (
        <SuccessModal
          attempts={state.attempts}
          hintsUsed={state.hintsUsed}
          wordsFound={wordLadder.length}
          startTime={state.startTime}
          onNextLevel={() => {
            setShowSuccess(false)
            if (state.mode !== "classic") {
              goHome()
              return
            }
            // POST /level already returned the next puzzle; only a failed or
            // still-pending call falls back to the bundled catalogue.
            const next = nextLevelRef.current
            nextLevelRef.current = null
            setGameState(
              next
                ? createGameState("classic", next)
                : createLocalGameState("classic", locale)
            )
          }}
          onBackToMenu={() => {
            setShowSuccess(false)
            goHome()
          }}
          showNextLevel={state.mode === "classic"}
        />
      )}
    </div>
  )
}
