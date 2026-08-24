"use client"

import type { ReactNode } from "react"
import { ScreenHeader as SharedScreenHeader } from "@marcel-games/ui"
import { useApp } from "@/lib/app-context"
import { t, type translations } from "@/lib/i18n"

type TranslationKey = keyof typeof translations.en

interface ScreenHeaderProps {
  /** i18n key, resolved here. */
  title: TranslationKey
  subtitle?: string
  onBack?: () => void
  actions?: ReactNode
}

/**
 * WordClimb's header: resolves i18n keys against the current locale, then
 * defers the layout to the shared component — the same one earthunt uses, so
 * the two games line their titles up the same way.
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  actions,
}: ScreenHeaderProps) {
  const { locale } = useApp()

  return (
    <SharedScreenHeader
      className="pt-4 text-[#0A3D62]"
      titleClassName="text-2xl md:text-3xl"
      title={t(locale, title)}
      subtitle={subtitle}
      onBack={onBack}
      backLabel={t(locale, "profileBack")}
      actions={actions}
    />
  )
}
