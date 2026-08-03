"use client"

import Image from "next/image"
import { useMemo, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { useAnimatedText } from "@/hooks/use-animated-text"
import { useLanguage } from "@/components/language-provider"

const SPLASH_MIN_MS = 2500

interface SplashScreenProps {
  onComplete: () => void
  initLoading?: boolean
  initError?: string | null
  onRetry?: () => void
}

export function SplashScreen({
  onComplete,
  initLoading = false,
  initError = null,
  onRetry,
}: SplashScreenProps) {
  const { t } = useLanguage()
  const title = useMemo(() => "EartHunt", [])
  const [titleOpacities, startTitle, titleChars] = useAnimatedText(title, 200)
  const subtitle = t("splash.subtitle")
  const [subtitleOpacities, startSubtitle, subtitleChars] = useAnimatedText(subtitle, 80)
  const completedRef = useRef(false)

  useEffect(() => {
    startTitle()
    startSubtitle()
  }, [startTitle, startSubtitle])

  useEffect(() => {
    if (completedRef.current) return
    const start = Date.now()
    const check = () => {
      if (completedRef.current) return
      const elapsed = Date.now() - start
      const minTimeElapsed = elapsed >= SPLASH_MIN_MS
      const initDone = !initLoading
      if (minTimeElapsed && initDone) {
        completedRef.current = true
        onComplete()
      }
    }
    const interval = setInterval(check, 100)
    return () => clearInterval(interval)
  }, [initLoading, onComplete])

  return (
    <div
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#69cbeb]"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="mb-5 flex w-full max-w-[300px] justify-center px-5">
        <Image
          src="/images/earth-logo.webp"
          alt="EartHunt"
          width={180}
          height={120}
          className="h-auto object-contain"
          priority
        />
      </div>

      {initLoading && (
        <div className="mb-4 flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[#0f2b3c]" aria-hidden />
          <span className="text-sm font-medium text-[#0f2b3c]/90">
            {t("profile.loading")}
          </span>
        </div>
      )}

      {initError && !initLoading && (
        <div className="mb-4 flex flex-col items-center gap-2 px-4 text-center">
          <p className="text-sm font-medium text-red-700">{initError}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-[#0f2b3c] shadow"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {!initError && (
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-wrap justify-center gap-0">
            {titleChars.map((letter, i) => (
              <span
                key={i}
                className="text-4xl font-extrabold tracking-tight text-[#0f2b3c] transition-opacity duration-300"
                style={{ opacity: titleOpacities[i] ?? 0 }}
              >
                {letter}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-0">
            {subtitleChars.map((letter, i) => (
              <span
                key={i}
                className="text-lg font-semibold text-[#0f2b3c]/90 transition-opacity duration-300"
                style={{ opacity: subtitleOpacities[i] ?? 0 }}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="absolute bottom-6 text-sm font-semibold text-[#0f2b3c]/80">
        Marcel Games
      </p>
    </div>
  )
}
