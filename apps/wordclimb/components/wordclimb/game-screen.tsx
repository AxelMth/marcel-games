"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { ArrowLeft, Lightbulb, HelpCircle } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { t } from "@/lib/i18n"
import { getDefinition } from "@/lib/data/definitions"
import { setClassicProgress, getClassicProgress, setDailyCompleted, createGameState } from "@/lib/game-store"
import type { GameState } from "@/lib/game-store"
import { WordRow } from "./word-row"
import { HintsModal } from "./hints-modal"
import { HelpModal } from "./help-modal"
import { SuccessModal } from "./success-modal"
import { resolveInterstitial } from "@/lib/ad-cadence"
import { useInterstitialAd } from "@/hooks/use-interstitial-ad"
import { useRewardedAd } from "@/hooks/use-rewarded-ad"

export function GameScreen() {
  const { locale, gameState, setGameState, goHome } = useApp()
  const [input, setInput] = useState("")
  const [showHints, setShowHints] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const ladderRef = useRef<HTMLDivElement>(null)
  // The session's single interstitial exemption. A ref, not state: spending it
  // must not re-render, and it must survive every level of the session.
  const adExemptionRef = useRef(true)
  const { preload: preloadAd, show: showAd } = useInterstitialAd()
  const { showRewardedAd } = useRewardedAd()

  const state = gameState!
  const level = state.level
  const { beginWord, endWord, wordLadder } = level

  // Full ladder: endWord, ...reversed(wordLadder), beginWord
  // Display: endWord at top, beginWord at bottom
  // User finds intermediate words from beginWord side going up

  useEffect(() => {
    // Warm the interstitial while the success modal is up, so the tap on
    // "next level" does not wait on a network fetch.
    if (showSuccess && state.mode === "classic") preloadAd()
  }, [showSuccess, state.mode, preloadAd])

  const currentTargetWord = wordLadder[state.currentWordIndex]
  const wordsLeft = wordLadder.length - state.currentWordIndex

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
        // Handle completion
        if (state.mode === "classic") {
          const currentProgress = getClassicProgress()
          setClassicProgress(currentProgress + 1)
        }
        if (state.mode === "daily") {
          setDailyCompleted()
        }
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
  }, [input, currentTargetWord, state, wordLadder, setGameState])

  const handleHint = useCallback(
    async (type: "firstLetter" | "fullWord") => {
      if (state.isComplete) return

      // Revealing the whole word skips the puzzle, so it is the one worth an
      // ad. The first letter stays free — same split as EarthHunt. The reward
      // callback is fail-open: if AdMob is unavailable the player still gets
      // the hint rather than being stuck.
      if (type === "fullWord") {
        await new Promise<void>((resolve) => showRewardedAd(() => resolve()))
        if (state.isComplete) return
      }

      if (type === "firstLetter") {
        setInput(currentTargetWord[0])
        setGameState({ ...state, hintsUsed: state.hintsUsed + 1 })
      } else {
        // Reveal full word
        const newFoundWords = [...state.foundWords]
        newFoundWords[state.currentWordIndex] = true
        const nextIndex = state.currentWordIndex + 1
        const isComplete = nextIndex >= wordLadder.length

        setGameState({
          ...state,
          foundWords: newFoundWords,
          currentWordIndex: nextIndex,
          hintsUsed: state.hintsUsed + 1,
          isComplete,
        })
        setInput("")

        if (isComplete) {
          if (state.mode === "classic") {
            setClassicProgress(getClassicProgress() + 1)
          }
          if (state.mode === "daily") {
            setDailyCompleted()
          }
          setTimeout(() => setShowSuccess(true), 600)
        }
      }
      setShowHints(false)
    },
    [state, currentTargetWord, wordLadder, setGameState, showRewardedAd]
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
      : state.mode === "daily"
        ? t(locale, "dailyChallenge")
        : t(locale, "random")

  return (
    <div
      className="flex flex-col h-[100dvh] bg-[#F8F8F8] relative"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#F8F8F8] border-b border-[#E0E0E0] z-10">
        <button
          onClick={goHome}
          className="flex items-center gap-1 text-[#1D70A2] font-semibold text-sm"
          aria-label="Back to menu"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-sm font-bold text-[#0A3D62]">{modeLabel}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHints(true)}
            className="flex items-center gap-1 rounded-full bg-[#1D70A2] bg-opacity-10 px-2.5 py-1 text-xs font-semibold text-[#1D70A2]"
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
        </div>
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
        <div className="border-t border-[#E0E0E0] bg-[#F8F8F8] px-4 py-3 z-10">
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
          onNextLevel={async () => {
            setShowSuccess(false)
            if (state.mode !== "classic") {
              goHome()
              return
            }
            // getClassicProgress is the level just banked, which is what the
            // cadence counts.
            const { show, consumesExemption } = resolveInterstitial({
              mode: "classic",
              level: getClassicProgress(),
              exemptionAvailable: adExemptionRef.current,
            })
            if (consumesExemption) adExemptionRef.current = false
            if (show) {
              // Never block progression on an ad: showInterstitial resolves
              // even when AdMob fails or the platform is web.
              try {
                await showAd()
              } catch {
                // ignored on purpose
              }
            }
            setGameState(createGameState("classic"))
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
