"use client"

import { useAnimatedText } from "@marcel-games/lib"

export function SplashScreen() {
  const text = useAnimatedText("WordClimb", 80)

  return (
    <main className="flex h-screen items-center justify-center bg-background">
      <h1 className="text-4xl font-bold text-primary">{text}</h1>
    </main>
  )
}
