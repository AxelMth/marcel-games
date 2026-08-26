"use client"

import { Target, Clock, Zap } from "lucide-react"
import { StarRating } from "@marcel-games/ui"
import { useApp } from "@/lib/app-context"
import { t } from "@/lib/i18n"
import { getStars } from "@/lib/stars"

interface SuccessModalProps {
  attempts: number
  hintsUsed: number
  wordsFound: number
  startTime: number
  onNextLevel: () => void
  onBackToMenu: () => void
  showNextLevel: boolean
}

export function SuccessModal({
  attempts,
  hintsUsed,
  wordsFound,
  startTime,
  onNextLevel,
  onBackToMenu,
  showNextLevel,
}: SuccessModalProps) {
  const { locale } = useApp()

  const elapsed = Math.floor((Date.now() - startTime) / 1000)
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`

  // Same verdict earthunt ends a level on, against this game's unit: words
  // found rather than countries. Mirrors the server's ComputeStars so the modal
  // and the history agree about the same game.
  const stars = getStars(attempts, wordsFound, hintsUsed)
  const ratingLabel =
    stars === 3
      ? t(locale, "ratingPerfect")
      : stars === 2
        ? t(locale, "ratingGreat")
        : t(locale, "ratingWellDone")

  const stats = [
    { icon: Target, label: t(locale, "attempts"), value: attempts, color: "#1D70A2" },
    { icon: Clock, label: t(locale, "time"), value: timeStr, color: "#2E8B57" },
    { icon: Zap, label: t(locale, "wordsFound"), value: wordsFound, color: "#D4782F" },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.5)] animate-in fade-in duration-200" />

      {/* Modal */}
      <div className="relative w-full max-w-sm mx-4 rounded-[20px] bg-[#F8F8F8] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col items-center pt-8 pb-4 px-5">
          <h2 className="mb-4 text-2xl font-bold text-[#0A3D62]">{ratingLabel}</h2>
          <StarRating
            stars={stars}
            earnedClassName="bg-[#2E8B57] text-white"
            emptyClassName="bg-[#0A3D62]/10 text-[#0A3D62]/25"
          />
          <p className="text-sm text-[#50555C] mt-4">
            {t(locale, "completeLevel")}
          </p>
        </div>

        {/* Stats */}
        <div className="px-5 py-4">
          {/* Une grille, pas justify-around : ce dernier répartit l'espace autour de
              colonnes dimensionnées par leur contenu, or « MOTS TROUVES » fait le
              double de « TEMPS ». Les pastilles et les valeurs ne tombaient donc
              pas sur une colonne commune. */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon size={18} style={{ color: stat.color }} />
                </div>
                <span className="text-xl font-bold text-[#0A3D62]">{stat.value}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#50555C]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {hintsUsed > 0 && (
            <p className="text-center text-xs text-[#50555C] mt-3">
              {t(locale, "hintUsed")}: {hintsUsed}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-5 flex flex-col gap-2 border-t border-[#E0E0E0]">
          {showNextLevel && (
            <button
              onClick={onNextLevel}
              className="w-full rounded-xl bg-[#2E8B57] py-3 text-sm font-bold text-[#F8F8F8] shadow-sm transition-colors hover:bg-[#257A4C]"
            >
              {t(locale, "nextLevel")}
            </button>
          )}
          <button
            onClick={onBackToMenu}
            className="w-full rounded-xl bg-[#1D70A2] py-3 text-sm font-bold text-[#F8F8F8] shadow-sm transition-colors hover:bg-[#165d8a]"
          >
            {t(locale, "backToMenu")}
          </button>
        </div>
      </div>
    </div>
  )
}
