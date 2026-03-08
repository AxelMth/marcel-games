"use client"

import Image from "next/image"
import { useMemo, useEffect } from "react"
import { useAnimatedText } from "@/hooks/use-animated-text"
import { useLanguage } from "@/components/language-provider"

const SPLASH_MIN_MS = 2500

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const { t } = useLanguage()
  const title = useMemo(() => "EartHunt", [])
  const [titleOpacities, startTitle, titleChars] = useAnimatedText(title, 200)
  const subtitle = t("splash.subtitle")
  const [subtitleOpacities, startSubtitle, subtitleChars] = useAnimatedText(subtitle, 80)

  useEffect(() => {
    startTitle()
    startSubtitle()
  }, [startTitle, startSubtitle])

  useEffect(() => {
    const t = setTimeout(onComplete, SPLASH_MIN_MS)
    return () => clearTimeout(t)
  }, [onComplete])

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
          src="/images/earth-logo.png"
          alt="EartHunt"
          width={180}
          height={120}
          className="h-auto object-contain"
          priority
        />
      </div>

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

      <p className="absolute bottom-6 text-sm font-semibold text-[#0f2b3c]/80">
        Marcel Games
      </p>
    </div>
  )
}
