"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import { Lightbulb, HelpCircle } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { t } from "@/lib/i18n";
import { ScreenHeader } from "@marcel-games/ui";
import { useKeyboardOffset, triggerNotificationHaptic } from "@marcel-games/lib";
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
import { enqueuePendingResult, flushPendingResults } from "@/lib/pending-results";
import {
  HINT_COSTS,
  confirmReportedSpend,
  getCoinBalance,
  reconcileCoins,
  spendCoins,
} from "@/lib/coins";
import { WordRow } from "./word-row";
import { HintsModal } from "./hints-modal";
import { HelpModal } from "./help-modal";
import { ShopModal } from "./shop-modal";
import { SuccessModal } from "./success-modal";

/** Must match STAGGER_MS in word-row.tsx and the CSS durations in globals.css. */
const LETTER_STAGGER_MS = 70;
const FOUND_ANIM_MS = 300;
/** How long a refused guess stays on screen before the rung is cleared. */
const WRONG_HOLD_MS = 600;

export function GameScreen() {
  const { locale, gameState, setGameState, goHome, userId, setProgress } =
    useApp();
  const [input, setInput] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // Mirrors the stored balance so the sheet re-renders as coins are spent.
  // Read lazily: on the server there is no storage to read from.
  const [coins, setCoins] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const ladderRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const currentRowRef = useRef<HTMLDivElement>(null);
  // Where to lay the input, in the ladder column's own coordinates.
  const [rungBox, setRungBox] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  // Which row is playing feedback, and which kind. Keyed by index rather than
  // "the current row": a solved word animates while currentWordIndex has
  // already moved on to the next rung.
  const [rowAnim, setRowAnim] = useState<{
    index: number;
    type: "success" | "error";
  } | null>(null);
  // Keystrokes are ignored while a refused guess plays out, so the letters
  // stay on screen long enough to be seen turning red.
  const [locked, setLocked] = useState(false);
  // Timers owned by the guess currently being shown. Cleared before a new
  // guess arms its own: two wrong words in quick succession used to leave the
  // first guess's timers running, and they would then wipe the second guess's
  // letters and toast a few hundred milliseconds after it appeared.
  const feedbackTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const keyboardOffset = useKeyboardOffset();

  const clearFeedbackTimers = useCallback(() => {
    for (const timer of feedbackTimers.current) clearTimeout(timer);
    feedbackTimers.current = [];
  }, []);

  const afterFeedback = useCallback((fn: () => void, delay: number) => {
    feedbackTimers.current.push(setTimeout(fn, delay));
  }, []);

  // Leaving mid-animation must not fire a state update into an unmounted tree.
  useEffect(() => clearFeedbackTimers, [clearFeedbackTimers]);

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

  // Hints already paid for, keyed "<rung>:<type>". A ref rather than game
  // state: it never leaves this screen, so it stays out of what gets
  // serialised and posted to the server.
  //
  // Buying the same hint twice on the same rung tells the player nothing they
  // did not already have — the definition text is unchanged, the first letter
  // is the same letter — so it is granted again for free. It also bounds what
  // one rung can cost at 1 + 1 + 3, which is the ceiling the server checks
  // against (domain.MaxCoinsPerRung). Revealing the whole word advances the
  // rung, so it cannot repeat.
  const paidHints = useRef<Set<string>>(new Set());

  /**
   * Brings the rung being solved back into view, if it has left.
   *
   * The ladder is a scrollable column and the field is invisible, so a player
   * who scrolls away keeps typing into letters they cannot see. Scrolling only
   * when the row is actually outside the visible band is what keeps this from
   * yanking the view on every keystroke.
   *
   * The band stops at the keyboard, not at the bottom of the viewport: under
   * KeyboardResize.None the webview never shrinks, so a row sitting behind the
   * keyboard measures as perfectly visible.
   */
  const ensureCurrentRowVisible = useCallback(() => {
    const row = currentRowRef.current;
    const ladder = ladderRef.current;
    if (!row || !ladder) return;

    const rowRect = row.getBoundingClientRect();
    const ladderRect = ladder.getBoundingClientRect();
    const visibleBottom = Math.min(
      ladderRect.bottom,
      window.innerHeight - keyboardOffset,
    );

    if (rowRect.top < ladderRect.top || rowRect.bottom > visibleBottom) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [keyboardOffset]);

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
        // Hints taken offline are charged to the server here, riding along
        // with the level they were spent on.
        coinsSpent: finished.coinsSpent,
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
          // The server has now applied this level's spend, so the ledger stops
          // holding it back — in that order, or reconcile would subtract it a
          // second time from a balance that already accounts for it.
          confirmReportedSpend(finished.coinsSpent);
          if (typeof response.coins === "number") {
            reconcileCoins(response.coins);
            setCoins(getCoinBalance());
          }
          // The server is reachable right now, which is the best moment to
          // clear anything banked while it was not.
          void flushPendingResults(userId);
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

      // This guess owns the feedback from here on; whatever the last one left
      // running would otherwise clear this one's letters early.
      clearFeedbackTimers();

      if (guess === target) {
        const solvedIndex = state.currentWordIndex;
        const newFoundWords = [...state.foundWords];
        newFoundWords[solvedIndex] = true;

        const nextIndex = solvedIndex + 1;
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
        setRowAnim({ index: solvedIndex, type: "success" });
        triggerNotificationHaptic("success");
        // Held until the last letter has finished lighting up, then dropped so
        // the row settles into its plain "found" colours.
        afterFeedback(
          () => setRowAnim(null),
          target.length * LETTER_STAGGER_MS + FOUND_ANIM_MS,
        );

        if (isComplete) {
          bankCompletion(newState);
          afterFeedback(() => setShowSuccess(true), 600);
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

        // The rung is not emptied yet: the refused letters have to stay up
        // while they flash red, or the player sees a blank row and never
        // learns which guess was rejected. Typing is locked for exactly that
        // window — the field itself stays mounted and focused, so the iOS
        // keyboard does not drop.
        setRowAnim({ index: state.currentWordIndex, type: "error" });
        setLocked(true);
        triggerNotificationHaptic("error");
        afterFeedback(() => {
          setInput("");
          setRowAnim(null);
          setLocked(false);
        }, WRONG_HOLD_MS);
      }

      // Clear feedback after a delay
      afterFeedback(() => {
        setGameState((prev) => (prev ? { ...prev, feedback: null } : prev));
      }, 1500);
    },
    [
      currentTargetWord,
      state,
      wordLadder,
      setGameState,
      bankCompletion,
      clearFeedbackTimers,
      afterFeedback,
    ],
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
      // A refused guess is still on screen turning red. Dropping the keystroke
      // rather than unmounting or disabling the field: iOS takes the keyboard
      // down with a disabled input, and it only grants it back to a real tap.
      if (locked) return;

      ensureCurrentRowVisible();

      const letters = raw
        .replace(/[^\p{L}]/gu, "")
        .slice(0, currentTargetWord.length);
      setInput(letters);
      if (letters.length === currentTargetWord.length) {
        submitGuess(letters);
      }
    },
    [currentTargetWord, submitGuess, locked, ensureCurrentRowVisible],
  );

  const handleHint = useCallback(
    (type: "firstLetter" | "fullWord" | "definition") => {
      if (state.isComplete) return;

      // Un indice ne se paie qu'une fois par barreau. Sans ce garde, rouvrir
      // la feuille pour relire une définition déjà payée la refacturait —
      // trois relectures du même mot suffisaient à faire tomber le niveau à
      // une étoile, alors que le joueur n'a rien appris de plus — et
      // redemander la première lettre reprenait une pièce pour réécrire la
      // même lettre.
      //
      // Le garde passe avant le débit, délibérément : c'est lui qui rend la
      // relecture gratuite, et facturer d'abord prendrait les pièces avant
      // qu'il ne refuse.
      const cost = HINT_COSTS[type];
      const paidKey = `${state.currentWordIndex}:${type}`;
      const alreadyPaid = paidHints.current.has(paidKey);

      if (type === "definition") {
        // La définition ne fait pas avancer la partie et ne referme pas la
        // feuille : elle s'y affiche.
        if (alreadyPaid) return;
        if (!spendCoins(cost)) return;
        paidHints.current.add(paidKey);
        setCoins(getCoinBalance());
        setGameState({
          ...state,
          hintsUsed: state.hintsUsed + 1,
          coinsSpent: state.coinsSpent + cost,
        });
        return;
      }

      if (type === "firstLetter" && alreadyPaid) {
        // Déjà payée : on la réaffiche sans repasser à la caisse.
        setInput(currentTargetWord[0]);
        setShowHints(false);
        return;
      }

      // The sheet disables what cannot be afforded, but the check belongs here
      // too: this is the only place that grants the hint.
      if (!spendCoins(cost)) return;
      paidHints.current.add(paidKey);
      setCoins(getCoinBalance());

      if (type === "firstLetter") {
        setInput(currentTargetWord[0]);
        setGameState({
          ...state,
          hintsUsed: state.hintsUsed + 1,
          coinsSpent: state.coinsSpent + cost,
        });
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
          coinsSpent: state.coinsSpent + cost,
          isComplete,
        };

        setGameState(newState);
        setInput("");

        if (isComplete) {
          bankCompletion(newState);
          afterFeedback(() => setShowSuccess(true), 600);
        }
      }
      setShowHints(false);
    },
    [
      state,
      currentTargetWord,
      wordLadder,
      setGameState,
      bankCompletion,
      afterFeedback,
    ],
  );

  // Centre the rung being solved: on every new rung, and again when the
  // keyboard opens or closes.
  //
  // The delay is the ladder's own padding-bottom transition (220ms): the
  // keyboard's height lands before the box has finished resizing, so measuring
  // straight away centres the row against a layout that is about to change.
  useEffect(() => {
    const timer = setTimeout(() => {
      currentRowRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [state.currentWordIndex, keyboardOffset]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reading storage during render would differ between server and client;
  // reading it here also applies the weekly refill for an offline player.
  useEffect(() => {
    setCoins(getCoinBalance());
  }, []);

  /**
   * Keeps the input laid over the rung being solved.
   *
   * Measured rather than positioned by CSS, because the field lives outside
   * the ladder so that solving a word moves it instead of replacing it — see
   * the comment where it is rendered. useLayoutEffect so it never paints a
   * frame at the old rung, and a resize listener because the row's width
   * follows the word length.
   */
  useLayoutEffect(() => {
    const place = () => {
      const row = currentRowRef.current;
      const column = columnRef.current;
      if (!row || !column) {
        setRungBox(null);
        return;
      }
      const rowRect = row.getBoundingClientRect();
      const columnRect = column.getBoundingClientRect();
      setRungBox({
        top: rowRect.top - columnRect.top,
        left: rowRect.left - columnRect.left,
        width: rowRect.width,
        height: rowRect.height,
      });
    };

    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [state.currentWordIndex, state.isComplete, wordLadder]);

  // "Next level" swaps the puzzle without unmounting this screen, so the paid
  // rungs have to be forgotten explicitly — otherwise rung 0 of every later
  // level would be free, having been paid for once on the first one.
  useEffect(() => {
    paidHints.current = new Set();
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
        <div ref={columnRef} className="relative flex flex-col items-center gap-3">
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
                <div
                  ref={isCurrent ? currentRowRef : undefined}
                  data-current={isCurrent || undefined}
                  className="relative"
                >
                  <WordRow
                    word={word}
                    state={isFound ? "found" : isCurrent ? "current" : "hidden"}
                    highlight={isCurrent}
                    typed={isCurrent ? input : undefined}
                    // Matched on the animation's own index: a solved word is no
                    // longer the current rung by the time it lights up.
                    animation={
                      rowAnim?.index === actualIdx ? rowAnim.type : null
                    }
                  />
                </div>
                <div className="w-0.5 h-3 bg-[#D0D0D0]" />
              </div>
            );
          })}

          {/*
            The keyboard's anchor, laid exactly over the rung being solved. It
            has to be a real, full-size, tappable field: WKWebView refuses to
            raise the keyboard for an input that has no meaningful box, which
            is why a 1px offscreen one did nothing at all. Transparent rather
            than hidden, so the letters the row draws are the only ones
            visible.

            It sits outside the ladder and is moved onto the current rung,
            rather than being rendered inside it. Rendered inside, solving a
            word unmounted it from one row and mounted a new one on the next —
            and an unmounted field takes the keyboard down with it, so the
            player had to tap again for every single rung. Focusing the new
            one from script does not bring it back: iOS grants the keyboard to
            a genuine touch and refuses it to a script, which is the same
            reason this field is the tap target in the first place.
          */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => handleType(e.target.value)}
            className="absolute bg-transparent text-transparent caret-transparent outline-none"
            style={{
              top: rungBox?.top ?? 0,
              left: rungBox?.left ?? 0,
              width: rungBox?.width ?? 0,
              height: rungBox?.height ?? 0,
              // No rung to solve — mid-completion, before the success sheet
              // opens. Nothing to type into, and nothing to intercept taps.
              pointerEvents: rungBox ? "auto" : "none",
              opacity: rungBox ? 1 : 0,
            }}
            aria-label={t(locale, "enterWord")}
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
          />

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
          coins={coins}
          onOpenShop={() => {
            setShowHints(false);
            setShowShop(true);
          }}
        />
      )}
      {showShop && (
        <ShopModal onClose={() => setShowShop(false)} coins={coins} />
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
