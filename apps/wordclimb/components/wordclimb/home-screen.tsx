"use client"

import Image from "next/image"
import { Globe } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { t } from "@/lib/i18n"
import { ModeCarousel } from "./mode-carousel"

export function HomeScreen() {
  const { locale, setLocale } = useApp()

  return (
    <div
      className="flex flex-col min-h-[100dvh] relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #55b3d1 0%, #69cbeb 40%, #c0e8f0 100%)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Language toggle */}
      <div className="flex justify-end p-4">
        <button
          onClick={() => setLocale(locale === "en" ? "fr" : "en")}
          className="flex items-center gap-1.5 rounded-full bg-[rgba(255,255,255,0.3)] backdrop-blur-sm px-3 py-1.5 text-sm font-semibold text-[#0A3D62] transition-colors hover:bg-[rgba(255,255,255,0.5)]"
          aria-label="Toggle language"
        >
          <Globe size={16} />
          {locale === "en" ? "FR" : "EN"}
        </button>
      </div>

      {/* Logo and title */}
      <div className="flex flex-col items-center gap-2 pt-4 pb-8">
        <div className="relative w-28 h-28">
          <Image
            src="/images/logo.png"
            alt="WordClimb logo - stacked books forming a pyramid"
            fill
            className="object-contain drop-shadow-lg"
            priority
          />
        </div>
        <h1 className="text-4xl font-bold text-[#0A3D62] tracking-tight drop-shadow-sm">
          {t(locale, "appName")}
        </h1>
        <p className="text-base text-[#1D70A2] font-medium opacity-80">
          {locale === "en" ? "Climb the word ladder" : "Gravis l'echelle de mots"}
        </p>
      </div>

      {/* Mode carousel */}
      <div className="flex-1 flex flex-col justify-center pb-8">
        <ModeCarousel />
      </div>

      {/* Decorative bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none">
        <svg viewBox="0 0 400 40" className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,20 Q50,0 100,15 T200,20 T300,10 T400,20 L400,40 L0,40 Z"
            fill="rgba(255,255,255,0.3)"
          />
        </svg>
      </div>
    </div>
  )
}
