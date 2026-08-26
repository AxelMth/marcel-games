"use client"

import * as React from "react"
import { Star } from "lucide-react"

import { cn } from "./utils"

export interface StarRatingProps {
  /** How many of `total` are earned. Clamped into range. */
  stars: number
  total?: number
  /**
   * `disc` is the end-of-level verdict: three large filled circles. `inline` is
   * the same score at list scale — bare stars, no disc — for a history row.
   */
  variant?: "disc" | "inline"
  /** Styling for an earned star (its disc in `disc`, the glyph in `inline`). */
  earnedClassName?: string
  /** Styling for an unearned one. */
  emptyClassName?: string
  className?: string
}

/**
 * The three-star verdict both games end a level on.
 *
 * Shared because the shape carries meaning: a filled disc reads as earned and a
 * hollow one as missed, and a player moving between the two games should not
 * have to relearn that. Only the palette differs, which is what the two
 * className props are for — earthunt fills amber on cyan, wordclimb on green.
 *
 * The score itself is not computed here. Each game measures accuracy against
 * its own unit — countries found, words found — and both mirror a rule that
 * lives on their server, so the number is the caller's business.
 */
export function StarRating({
  stars,
  total = 3,
  variant = "disc",
  earnedClassName,
  emptyClassName,
  className,
}: StarRatingProps) {
  const earnedCount = Math.max(0, Math.min(total, Math.round(stars)))
  const inline = variant === "inline"
  const earned = earnedClassName ?? (inline ? "text-amber-400" : "bg-amber-400 text-white")
  const empty = emptyClassName ?? (inline ? "text-black/20" : "bg-white/40 text-white/60")

  return (
    <div
      className={cn("flex", inline ? "gap-0.5" : "gap-2", className)}
      role="img"
      aria-label={`${earnedCount} / ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const isEarned = i < earnedCount
        const star = (
          <Star
            className={cn(inline ? "h-4 w-4" : "h-6 w-6", inline && (isEarned ? earned : empty))}
            fill={isEarned ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.5}
          />
        )

        if (inline) return <span key={i} aria-hidden>{star}</span>

        return (
          <div
            key={i}
            aria-hidden
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              isEarned ? earned : empty
            )}
          >
            {star}
          </div>
        )
      })}
    </div>
  )
}
