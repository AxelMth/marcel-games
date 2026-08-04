"use client"

import { ArrowLeft, Settings } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

interface ScreenHeaderProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  onBack?: () => void
  showCog?: boolean
  onCogClick?: () => void
}

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
    <header className="flex w-full flex-row items-center justify-between px-5 pt-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {showBackButton && onBack ? (
          <button
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/30 backdrop-blur-sm transition-colors active:bg-white/50"
            aria-label={t("profile.back")}
          >
            <ArrowLeft className="h-5 w-5 text-[#0f2b3c]" />
          </button>
        ) : (
          <div className="h-10 w-10 shrink-0" aria-hidden />
        )}
        <div className="min-w-0 flex-1 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0f2b3c]">
            {t(title)}
          </h1>
          {subtitle && (
            <p className="text-sm font-medium text-[#0f2b3c]/80">
              {t(subtitle)}
            </p>
          )}
        </div>
      </div>
      {showCog && onCogClick ? (
        <button
          onClick={onCogClick}
          data-tour="stats-cog"
          className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/30 backdrop-blur-sm transition-colors active:bg-white/50"
          aria-label={t("profile.settings")}
        >
          <Settings className="h-5 w-5 text-[#0f2b3c]" />
        </button>
      ) : (
        <div className="h-10 w-10 shrink-0" aria-hidden />
      )}
    </header>
  )
}
