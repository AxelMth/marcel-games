"use client"

import { Settings } from "lucide-react"
import { ScreenHeader as SharedScreenHeader } from "@marcel-games/ui"
import { useLanguage } from "@/components/language-provider"

interface ScreenHeaderProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  onBack?: () => void
  showCog?: boolean
  onCogClick?: () => void
}

/**
 * Earthunt's header: resolves i18n keys and supplies the cog, then defers the
 * layout to the shared component. Props stay keys rather than strings so every
 * call site reads the same as before.
 */
export function ScreenHeader({
  title = "app.title",
  subtitle,
  showBackButton = false,
  onBack,
  showCog = true,
  onCogClick,
}: ScreenHeaderProps) {
  const { t } = useLanguage()

  return (
    <SharedScreenHeader
      className="pt-6 text-[#0f2b3c]"
      title={t(title)}
      subtitle={subtitle ? t(subtitle) : undefined}
      onBack={showBackButton ? onBack : undefined}
      backLabel={t("profile.back")}
      actions={
        showCog && onCogClick ? (
          <button
            onClick={onCogClick}
            data-tour="stats-cog"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/30 backdrop-blur-sm transition-colors active:bg-white/50"
            aria-label={t("profile.settings")}
          >
            <Settings className="h-5 w-5 text-[#0f2b3c]" />
          </button>
        ) : undefined
      }
    />
  )
}
