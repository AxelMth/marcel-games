"use client"
import { AppProvider } from "@/lib/app-context"
import { WordClimbApp } from "@/components/wordclimb/app"

export default function Page() {
  return (
    <AppProvider>
      <WordClimbApp />
    </AppProvider>
  )
}
