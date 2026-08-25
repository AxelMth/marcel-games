"use client"

import * as React from "react"
import { Star } from "lucide-react"

import { cn } from "./utils"

export interface StarRatingProps {
  /** How many of `total` are earned. Clamped into range. */
  stars: number
  total?: number
  /** Styling for an earned star's disc. */
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
  earnedClassName = "bg-amber-400 text-white",
  emptyClassName = "bg-white/40 text-white/60",
  className,
}: StarRatingProps) {
  const earnedCount = Math.max(0, Math.min(total, Math.round(stars)))

  return (
    <div
      className={cn("flex gap-2", className)}
      role="img"
      aria-label={`${earnedCount} / ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const earned = i < earnedCount
        return (
          <div
            key={i}
            aria-hidden
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              earned ? earnedClassName : emptyClassName
            )}
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
  )
}
