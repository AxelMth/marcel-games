"use client"

import { LetterBox } from "./letter-box"

/** Milliseconds between two letters lighting up on a solved word. */
const STAGGER_MS = 70

interface WordRowProps {
  word: string
  state: "given" | "found" | "current" | "hidden"
  highlight?: boolean
  label?: string
  /**
   * What the player has typed so far, for the row they are working on. The row
   * shows these letters and blanks the rest.
   */
  typed?: string
  /**
   * Feedback on the guess just played on this row: a solved word lights up one
   * letter at a time, a refused one flashes whole.
   */
  animation?: "success" | "error" | null
}

/**
 * One rung of the ladder.
 *
 * The row decides what the player is allowed to see, which is the whole point:
 * `word` is always the real answer, and only `given` and `found` rungs may
 * render it. The rung being solved shows the player's own keystrokes, and an
 * unreached rung shows nothing at all.
 *
 * That division used to sit in LetterBox, which blanked `hidden` and printed
 * everything else — so the rung being solved displayed the answer it was asking
 * for. The whole puzzle was readable off the board.
 */
export function WordRow({
  word,
  state,
  highlight,
  label,
  typed = "",
  animation = null,
}: WordRowProps) {
  const letters = word.split("").map((letter, i) => {
    if (state === "given" || state === "found") return letter
    // The typed string can run past the answer's length while the player is
    // still editing; only the positions the row actually has are shown.
    if (state === "current") return typed[i] ?? ""
    return "?"
  })

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#50555C] opacity-70">
          {label}
        </span>
      )}
      {/* The shake belongs to the row: moving each box on its own would pull
          the word apart instead of rejecting it as one guess. */}
      <div className={animation === "error" ? "flex gap-1.5 wc-row-shake" : "flex gap-1.5"}>
        {letters.map((letter, i) => (
          <LetterBox
            key={i}
            letter={letter}
            state={state}
            // The pulse marks where the next keystroke lands, so it follows the
            // caret rather than sitting on the first box for ever.
            highlight={highlight && i === Math.min(typed.length, word.length - 1)}
            animation={
              animation === "success"
                ? "found"
                : animation === "error"
                  ? "wrong"
                  : undefined
            }
            // Left to right on success, so the word reads as being accepted;
            // all at once on failure, so it reads as one refused guess.
            animationDelay={animation === "success" ? i * STAGGER_MS : undefined}
          />
        ))}
      </div>
    </div>
  )
}
