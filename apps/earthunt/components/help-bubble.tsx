"use client"

import { HelpCircle, Lightbulb, BookOpen, X } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

interface HelpBubbleProps {
  expanded: boolean
  onFirstClick: () => void
  onClose: () => void
  onSelectHints: () => void
  onSelectHelp: () => void
}

export function HelpBubble({
  expanded,
  onFirstClick,
  onClose,
  onSelectHints,
  onSelectHelp,
}: HelpBubbleProps) {
  const { t } = useLanguage()
  const bubbleBottom = "calc(7rem + env(safe-area-inset-bottom, 0px))"
  const bubbleRight = "max(1rem, env(safe-area-inset-right, 0px))"

  if (!expanded) {
    return (
      <button
        type="button"
        data-tour="help-bubble"
        onClick={onFirstClick}
        className="absolute z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-xl backdrop-blur-sm transition-all duration-200 active:scale-90 border-2 border-[#1a8fb5]/30"
        style={{
          bottom: bubbleBottom,
          right: bubbleRight,
        }}
        aria-label="Hints and help"
      >
        <HelpCircle className="h-9 w-9 text-[#1a8fb5]" />
      </button>
    )
  }

  return (
    <div
      className="absolute z-10 flex flex-col items-end gap-2 transition-all duration-200"
      style={{
        bottom: bubbleBottom,
        right: bubbleRight,
      }}
    >
      <button
        type="button"
        onClick={onSelectHelp}
        className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm transition-transform active:scale-95 border-2 border-[#1a8fb5]/30"
        aria-label="How to play"
      >
        <BookOpen className="h-5 w-5 text-[#1a8fb5]" />
        <span className="text-sm font-bold text-[#0f2b3c]">{t("helpBubble.howToPlay")}</span>
      </button>
      <button
        type="button"
        onClick={onSelectHints}
        className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm transition-transform active:scale-95 border-2 border-[#1a8fb5]/30"
        aria-label="Get hints"
      >
        <Lightbulb className="h-5 w-5 text-[#1a8fb5]" />
        <span className="text-sm font-bold text-[#0f2b3c]">{t("helpBubble.hints")}</span>
      </button>
      <button
        type="button"
        onClick={onClose}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-xl backdrop-blur-sm transition-transform active:scale-95 border-2 border-[#1a8fb5]/30"
        aria-label="Close"
      >
        <X className="h-9 w-9 text-[#1a8fb5]" />
      </button>
    </div>
  )
}
