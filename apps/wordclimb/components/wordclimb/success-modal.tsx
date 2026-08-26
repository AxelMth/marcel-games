"use client"

import { Target, Clock, Zap } from "lucide-react"
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  StarRating,
} from "@marcel-games/ui"
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
    /*
      Une modale dont on ne sort que par un des deux boutons : pas de croix, pas
      de fermeture au clic extérieur, pas d'Échap. Le niveau vient d'être
      enregistré, et fermer sans choisir laisserait le joueur sur un plateau
      terminé sans moyen d'avancer.

      Radix ferme sur ces trois gestes par défaut ; il faut donc les refuser
      explicitement, ce qui est plus sûr que l'ancien div — celui-ci ne se
      fermait pas non plus, mais faute d'avoir été câblé, pas par choix.
    */
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-sm gap-0 overflow-hidden rounded-[20px] border-0 bg-[#F8F8F8] p-0"
      >
        {/* Header */}
        <div className="flex flex-col items-center px-5 pb-4 pt-8">
          <DialogTitle className="mb-4 text-2xl font-bold text-[#0A3D62]">
            {ratingLabel}
          </DialogTitle>
          <StarRating
            stars={stars}
            earnedClassName="bg-[#2E8B57] text-white"
            emptyClassName="bg-[#0A3D62]/10 text-[#0A3D62]/25"
          />
          <p className="mt-4 text-sm text-[#50555C]">
            {t(locale, "completeLevel")}
          </p>
        </div>

        {/* Stats */}
        <div className="px-5 py-4">
          {/* Une grille, pas justify-around : ce dernier répartit l'espace autour
              de colonnes dimensionnées par leur contenu, or « MOTS TROUVES »
              fait le double de « TEMPS ». Les pastilles et les valeurs ne
              tombaient donc pas sur une colonne commune. */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${stat.color}26` }}
                >
                  <stat.icon size={18} style={{ color: stat.color }} />
                </div>
                <span className="text-xl font-bold text-[#0A3D62]">
                  {stat.value}
                </span>
                <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-[#50555C]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {hintsUsed > 0 && (
            <p className="mt-3 text-center text-xs text-[#50555C]">
              {t(locale, "hintUsed")}: {hintsUsed}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 border-t border-[#E0E0E0] px-5 py-5">
          {showNextLevel && (
            <Button
              size="lg"
              className="w-full bg-[#2E8B57] text-[#F8F8F8]"
              onClick={onNextLevel}
            >
              {t(locale, "nextLevel")}
            </Button>
          )}
          <Button size="lg" className="w-full" onClick={onBackToMenu}>
            {t(locale, "backToMenu")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
