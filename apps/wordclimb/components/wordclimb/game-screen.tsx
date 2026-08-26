"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Lightbulb, HelpCircle } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { t } from "@/lib/i18n";
import { ScreenHeader } from "@marcel-games/ui";
import { useKeyboardOffset } from "@marcel-games/lib";
import {
  setClassicProgress,
  getClassicProgress,
  setDailyCompleted,
  createGameState,
  createLocalGameState,
  levelFromApi,
  toBackendGameMode,
  toBackendLocale,
} from "@/lib/game-store";
import type { GameState } from "@/lib/game-store";
import { postFinishLevel } from "@/lib/api";
import { enqueuePendingResult } from "@/lib/pending-results";
import { WordRow } from "./word-row";
import { HintsModal } from "./hints-modal";
import { HelpModal } from "./help-modal";
import { SuccessModal } from "./success-modal";

export function GameScreen() {
  const { locale, gameState, setGameState, goHome, userId, setProgress } =
    useApp();
  const [input, setInput] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ladderRef = useRef<HTMLDivElement>(null);
  const keyboardOffset = useKeyboardOffset();

  const state = gameState!;
  const level = state.level;
  const { beginWord, endWord, wordLadder } = level;

  // Full ladder: endWord, ...reversed(wordLadder), beginWord
  // Display: endWord at top, beginWord at bottom
  // User finds intermediate words from beginWord side going up

  const currentTargetWord = wordLadder[state.currentWordIndex];
  const wordsLeft = wordLadder.length - state.currentWordIndex;

  // The next puzzle, as the server hands it back when a level is banked. Held
  // here so the "next level" tap does not have to make a second round trip.
  const nextLevelRef = useRef<GameState["level"] | null>(null);

  // Rungs whose definition has already been charged for. A ref rather than
  // game state: it never leaves this screen, so it stays out of what gets
  // serialised and posted to the server.
  const definitionsPaid = useRef<Set<number>>(new Set());

  /**
   * Records a finished level: locally first, so progression survives with no
   * network, then against the API. A result that cannot be sent is queued and
   * replayed at the next launch — the player never waits on it.
   */
  const bankCompletion = useCallback(
    (finished: GameState) => {
      if (finished.mode === "classic") {
        setClassicProgress(getClassicProgress() + 1);
      }
      if (finished.mode === "daily") {
        setDailyCompleted();
      }

      const result = {
        attempts: finished.attempts,
        timeSpent: Math.max(
          0,
          Math.floor((Date.now() - finished.startTime) / 1000),
        ),
        hintsUsed: finished.hintsUsed,
        gameMode: toBackendGameMode(finished.mode),
        locale: toBackendLocale(locale),
        beginWord: finished.level.beginWord,
        endWord: finished.level.endWord,
        wordLadder: finished.level.wordLadder,
      };

      if (!userId) {
        enqueuePendingResult(result);
        return;
      }

      postFinishLevel({ userId, ...result })
        .then((response) => {
          nextLevelRef.current = levelFromApi({
            level: response.nextLevel,
            beginWord: response.nextBeginWord,
            endWord: response.nextEndWord,
            wordLadder: response.nextWordLadder,
          });
          if (response.stats) {
            setProgress((p) => (p ? { ...p, stats: response.stats } : p));
          }
        })
        .catch(() => {
          enqueuePendingResult(result);
        });
    },
    [locale, userId, setProgress],
  );

  const submitGuess = useCallback(
    (raw: string) => {
      if (!raw.trim()) return;

      const guess = raw.trim().toLowerCase();
      const target = currentTargetWord.toLowerCase();

      if (guess === target) {
        const newFoundWords = [...state.foundWords];
        newFoundWords[state.currentWordIndex] = true;

        const nextIndex = state.currentWordIndex + 1;
        const isComplete = nextIndex >= wordLadder.length;

        const newState: GameState = {
          ...state,
          foundWords: newFoundWords,
          currentWordIndex: nextIndex,
          attempts: state.attempts + 1,
          feedback: "correct",
          isComplete,
        };

        setGameState(newState);
        setInput("");

        if (isComplete) {
          bankCompletion(newState);
          setTimeout(() => setShowSuccess(true), 600);
        }
      } else {
        // Check if already found
        const alreadyFound = state.foundWords.some(
          (found, idx) => found && wordLadder[idx].toLowerCase() === guess,
        );

        setGameState({
          ...state,
          attempts: state.attempts + 1,
          feedback: alreadyFound ? "already" : "wrong",
        });
        // Empty the rung so the next keystroke starts a fresh word rather than
        // appending to a guess that was already refused.
        setInput("");
      }

      // Clear feedback after a delay
      setTimeout(() => {
        setGameState((prev) => (prev ? { ...prev, feedback: null } : prev));
      }, 1500);
    },
    [currentTargetWord, state, wordLadder, setGameState, bankCompletion],
  );

  /**
   * Every keystroke lands here. There is no submit button: a rung is played the
   * moment it is full, which is the whole interaction — type the word, it goes.
   *
   * Letters only, and never more than the rung holds, so the guess can be
   * compared on length alone and a stray character cannot wedge the row.
   */
  const handleType = useCallback(
    (raw: string) => {
      const letters = raw
        .replace(/[^\p{L}]/gu, "")
        .slice(0, currentTargetWord.length);
      setInput(letters);
      if (letters.length === currentTargetWord.length) {
        submitGuess(letters);
      }
    },
    [currentTargetWord, submitGuess],
  );

  const handleHint = useCallback(
    (type: "firstLetter" | "fullWord" | "definition") => {
      if (state.isComplete) return;

      // La définition ne fait pas avancer la partie et ne referme pas la
      // feuille : elle s'y affiche. Elle coûte un indice comme les autres,
      // parce que la règle du jeu est de taper le mot sans aide.
      //
      // Mais elle ne coûte qu'une fois par mot. Sans ce garde, rouvrir la
      // feuille pour relire un texte déjà payé le refacturait : trois
      // relectures du même mot suffisaient à faire tomber le niveau à une
      // étoile, alors que le joueur n'a rien appris de plus.
      if (type === "definition") {
        if (definitionsPaid.current.has(state.currentWordIndex)) return;
        definitionsPaid.current.add(state.currentWordIndex);
        setGameState({ ...state, hintsUsed: state.hintsUsed + 1 });
        return;
      }

      if (type === "firstLetter") {
        setInput(currentTargetWord[0]);
        setGameState({ ...state, hintsUsed: state.hintsUsed + 1 });
      } else {
        // Reveal full word
        const newFoundWords = [...state.foundWords];
        newFoundWords[state.currentWordIndex] = true;
        const nextIndex = state.currentWordIndex + 1;
        const isComplete = nextIndex >= wordLadder.length;

        const newState: GameState = {
          ...state,
          foundWords: newFoundWords,
          currentWordIndex: nextIndex,
          hintsUsed: state.hintsUsed + 1,
          isComplete,
        };

        setGameState(newState);
        setInput("");

        if (isComplete) {
          bankCompletion(newState);
          setTimeout(() => setShowSuccess(true), 600);
        }
      }
      setShowHints(false);
    },
    [state, currentTargetWord, wordLadder, setGameState, bankCompletion],
  );

  // Scroll ladder to show current word
  useEffect(() => {
    if (ladderRef.current) {
      const currentEl = ladderRef.current.querySelector("[data-current]");
      if (currentEl) {
        currentEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [state.currentWordIndex]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // "Next level" swaps the puzzle without unmounting this screen, so the paid
  // rungs have to be forgotten explicitly — otherwise rung 0 of every later
  // level would be free, having been paid for once on the first one.
  useEffect(() => {
    definitionsPaid.current = new Set();
  }, [state.startTime]);

  const modeLabel =
    state.mode === "classic"
      ? `${t(locale, "level")} ${getClassicProgress() + 1}`
      : t(locale, "dailyChallenge");

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
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#50555C] active:bg-[#1D70A2]/10"
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
            {wordsLeft}{" "}
            {wordsLeft === 1 ? t(locale, "wordLeft") : t(locale, "wordsLeft")}
          </span>
        </div>
      )}

      {/* Word ladder display */}
      {/* The ladder is the input surface: tapping it raises the keyboard. The
          bottom padding is the keyboard's own height, so the rung being solved
          never ends up underneath it — there is no bar left to lift instead. */}
      <div
        ref={ladderRef}
        onClick={() => inputRef.current?.focus()}
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{
          paddingBottom:
            keyboardOffset > 0
              ? `calc(1.5rem + ${keyboardOffset}px)`
              : "max(1.5rem, env(safe-area-inset-bottom, 0px))",
          transition: "padding-bottom 220ms ease-out",
        }}
      >
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
            const actualIdx = wordLadder.length - 1 - reverseIdx;
            const isFound = state.foundWords[actualIdx];
            const isCurrent =
              actualIdx === state.currentWordIndex && !state.isComplete;

            return (
              <div
                key={`word-${actualIdx}`}
                className="flex flex-col items-center gap-3"
              >
                <div data-current={isCurrent || undefined} className="relative">
                  <WordRow
                    word={word}
                    state={isFound ? "found" : isCurrent ? "current" : "hidden"}
                    highlight={isCurrent}
                    typed={isCurrent ? input : undefined}
                  />
                  {/*
                    The keyboard's anchor, laid exactly over the rung being
                    solved. It has to be a real, full-size, tappable field:
                    WKWebView refuses to raise the keyboard for an input that
                    has no meaningful box, which is why a 1px offscreen one did
                    nothing at all. Transparent rather than hidden, so the
                    letters the row draws are the only ones visible.

                    Being the tap target itself also means no programmatic
                    focus() is needed — iOS grants the keyboard to a genuine
                    touch, and refuses it to a script.
                  */}
                  {isCurrent && (
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => handleType(e.target.value)}
                      className="absolute inset-0 h-full w-full bg-transparent text-transparent caret-transparent outline-none"
                      aria-label={t(locale, "enterWord")}
                      inputMode="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="off"
                      spellCheck="false"
                    />
                  )}
                </div>
                <div className="w-0.5 h-3 bg-[#D0D0D0]" />
              </div>
            );
          })}

          {/* Begin word at bottom */}
          <WordRow
            word={beginWord}
            state="given"
            label={locale === "en" ? "START" : "DEBUT"}
          />
        </div>
      </div>

      {/* Feedback toast */}
      {state.feedback && (
        <div
          className={`pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-bold shadow-lg animate-in fade-in slide-in-from-bottom-2 ${
            state.feedback === "correct"
              ? "bg-[#2E8B57] text-[#F8F8F8]"
              : state.feedback === "wrong"
                ? "bg-[#DC3545] text-[#F8F8F8]"
                : "bg-[#D4782F] text-[#F8F8F8]"
          }`}
          style={{
            // Sous KeyboardResize.None la vue ne rétrécit jamais, donc un
            // décalage fixe laisse le toast derrière le clavier — et le clavier
            // est ouvert en permanence, le barreau prenant le focus au montage.
            bottom:
              keyboardOffset > 0
                ? `calc(2rem + ${keyboardOffset}px)`
                : "calc(2rem + env(safe-area-inset-bottom, 0px))",
            transition: "bottom 220ms ease-out",
          }}
        >
          {state.feedback === "correct"
            ? t(locale, "correct")
            : state.feedback === "wrong"
              ? t(locale, "wrong")
              : t(locale, "alreadyFound")}
        </div>
      )}

      {/* Modals */}
      {showHints && (
        <HintsModal
          onClose={() => setShowHints(false)}
          onHint={handleHint}
          targetWord={currentTargetWord}
        />
      )}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showSuccess && (
        <SuccessModal
          attempts={state.attempts}
          hintsUsed={state.hintsUsed}
          wordsFound={wordLadder.length}
          startTime={state.startTime}
          onNextLevel={() => {
            setShowSuccess(false);
            if (state.mode !== "classic") {
              goHome();
              return;
            }
            // POST /level already returned the next puzzle; only a failed or
            // still-pending call falls back to the bundled catalogue.
            const next = nextLevelRef.current;
            nextLevelRef.current = null;
            setGameState(
              next
                ? createGameState("classic", next)
                : createLocalGameState("classic", locale),
            );
          }}
          onBackToMenu={() => {
            setShowSuccess(false);
            goHome();
          }}
          showNextLevel={state.mode === "classic"}
        />
      )}
    </div>
  );
}
