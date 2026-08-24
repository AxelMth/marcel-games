"use client"

import * as React from "react"
import { ArrowLeft } from "lucide-react"

import { cn } from "./utils"

export interface ScreenHeaderProps {
  /** Already-translated title. Each app owns its own i18n. */
  title: string
  /** Already-translated subtitle, shown under the title. */
  subtitle?: string
  /** Renders the back button when supplied. */
  onBack?: () => void
  /** Accessible label for the back button. */
  backLabel?: string
  /**
   * Styling for the back button. The default translucent pill is meant for a
   * coloured background; on a near-white bar it shows up as a faint ghost box,
   * so a surface that light passes its own.
   */
  backClassName?: string
  /** Right-hand slot: cog, language toggle, anything. */
  actions?: React.ReactNode
  /**
   * Sizing for the wordmark. Each app's title is a different length against a
   * different number of action buttons, so the size that fits is the app's call
   * — earthunt's single cog leaves room for `text-3xl`, wordclimb's language
   * toggle plus cog does not.
   */
  titleClassName?: string
  className?: string
}

/**
 * The title block every full-screen view starts with.
 *
 * The three columns are what makes it worth sharing. Laid out as
 * `justify-between`, the title drifts off centre by half the difference between
 * the two side groups — invisible on earthunt, where a 40px spacer faces a 40px
 * cog, and obvious on wordclimb, where one back arrow faces a language toggle
 * plus a cog. Giving both side groups `flex-1` makes them share the free space
 * equally, which centres the title against the *screen* whatever each app hangs
 * on either side; `min-w-10` keeps each side at least one touch target wide.
 *
 * Vertical padding is left out on purpose: the safe-area inset belongs to the
 * screen that owns the viewport, not to a component that does not know whether
 * it sits at the top of the page.
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = "Go back",
  backClassName = "bg-white/30 backdrop-blur-sm active:bg-white/50",
  actions,
  titleClassName = "text-3xl",
  className,
}: ScreenHeaderProps) {
  return (
    <header
      className={cn("flex w-full items-center gap-3 px-5", className)}
    >
      <div className="flex min-w-10 flex-1 justify-start">
        {onBack ? (
          <button
            onClick={onBack}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
              backClassName
            )}
            aria-label={backLabel}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <div className="h-10 w-10 shrink-0" aria-hidden />
        )}
      </div>

      <div className="flex min-w-0 flex-col items-center justify-center">
        {/* w-full is what makes `truncate` bite: in a column flex box the h1
            would otherwise size to its content and simply paint over the
            buttons instead of clipping. */}
        <h1
          className={cn(
            "w-full truncate text-center font-extrabold tracking-tight",
            titleClassName
          )}
        >
          {title}
        </h1>
        {subtitle && <p className="text-sm font-medium opacity-80">{subtitle}</p>}
      </div>

      <div className="flex min-w-10 flex-1 items-center justify-end gap-2">
        {actions ?? <div className="h-10 w-10 shrink-0" aria-hidden />}
      </div>
    </header>
  )
}
