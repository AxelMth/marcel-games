"use client"

import Image from "next/image"
import { Globe, Settings, Loader2 } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { t } from "@/lib/i18n"
import { ModeCarousel } from "./mode-carousel"

export function HomeScreen() {
  const {
    locale,
    setLocale,
    goToStats,
    isLoadingProgress,
    gameError,
  } = useApp()

  return (
    <div
      className="flex min-h-[100dvh] flex-col relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #55b3d1 0%, #69cbeb 40%, #c0e8f0 100%)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Header: language + title + settings */}
      <header className="flex w-full flex-row items-center justify-between px-4 pt-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-10 w-10 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0A3D62] md:text-3xl">
              {t(locale, "appName")}
            </h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setLocale(locale === "en" ? "fr" : "en")}
            className="flex items-center gap-1.5 rounded-full bg-[rgba(255,255,255,0.3)] px-3 py-1.5 text-sm font-semibold text-[#0A3D62] backdrop-blur-sm transition-colors hover:bg-[rgba(255,255,255,0.5)]"
            aria-label="Toggle language"
          >
            <Globe size={16} />
            {locale === "en" ? "FR" : "EN"}
          </button>
          <button
            onClick={() => goToStats()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/30 text-[#0A3D62] backdrop-blur-sm transition-colors active:bg-white/50"
            aria-label="Stats and settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Logo and subtitle */}
      <div className="flex flex-col items-center gap-2 px-4 pb-4">
        <div className="relative h-20 w-20 md:h-28 md:w-28">
          <Image
            src="/images/logo.png"
            alt="WordClimb logo"
            fill
            className="object-contain drop-shadow-lg"
            priority
          />
        </div>
        <p className="text-base font-medium text-[#1D70A2] opacity-80">
          {locale === "en"
            ? "Climb the word ladder"
            : "Gravis l'echelle de mots"}
        </p>
      </div>

      {gameError && (
        <p className="mb-2 px-4 text-center text-sm font-medium text-red-600">
          {gameError}
        </p>
      )}

      {/* Mode carousel or loading */}
      <div className="flex flex-1 flex-col items-center justify-center pb-4">
        {isLoadingProgress ? (
          <div className="flex items-center justify-center gap-2 px-4">
            <Loader2 className="h-5 w-5 animate-spin text-[#0A3D62]" />
            <span className="text-sm font-medium text-[#0A3D62]/80">
              {locale === "en" ? "Loading…" : "Chargement…"}
            </span>
          </div>
        ) : (
          <ModeCarousel />
        )}
      </div>

      <p
        className="py-4 text-center text-sm font-medium text-[#0A3D62]/80"
        style={{
          paddingBottom:
            "max(1rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        {t(locale, "scrollToSelect")}
      </p>

      {/* Decorative bottom wave */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16">
        <svg
          viewBox="0 0 400 40"
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0,20 Q50,0 100,15 T200,20 T300,10 T400,20 L400,40 L0,40 Z"
            fill="rgba(255,255,255,0.3)"
          />
        </svg>
      </div>
    </div>
  )
}
