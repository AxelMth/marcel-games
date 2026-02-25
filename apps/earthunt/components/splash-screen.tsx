"use client"

import { useEffect, useState } from "react"
import { useAnimatedText } from "@marcel-games/lib"
import { useLanguage } from "./language-provider"

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const { t } = useLanguage()
  const title = useAnimatedText("EartHunt", 100)
  const [fade, setFade] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setFade(true), 2200)
    const done = setTimeout(onComplete, 2800)
    return () => {
      clearTimeout(timer)
      clearTimeout(done)
    }
  }, [onComplete])

  return (
    <main
      className={`flex h-screen flex-col items-center justify-center gap-3 bg-background transition-opacity duration-500 ${
        fade ? "opacity-0" : "opacity-100"
      }`}
    >
      <h1 className="text-5xl font-bold text-primary">{title}</h1>
      <p className="text-lg text-muted-foreground">{t("splash.subtitle")}</p>
    </main>
  )
}
