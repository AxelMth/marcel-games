"use client"

import { useState } from "react"
import { Type, Eye, BookOpen } from "lucide-react"
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@marcel-games/ui"
import { useApp } from "@/lib/app-context"
import { t } from "@/lib/i18n"
import { getDefinition } from "@/lib/data/definitions"
import { HintChoice } from "./hint-choice"

interface HintsModalProps {
  onClose: () => void
  onHint: (type: "firstLetter" | "fullWord" | "definition") => void | Promise<void>
  /** Le barreau en cours. Absent une fois le niveau fini. */
  targetWord: string | undefined
}

/**
 * Une feuille Radix, pas un div : c'est la même fonction, sur le même geste,
 * qu'earthunt rend avec ce composant (hints-help-sheet.tsx). Ce qu'on gagne au
 * passage n'est pas cosmétique — Échap ferme, le focus est piégé dans la
 * feuille, le fond ne défile plus derrière, et le rôle de dialogue est annoncé.
 * L'échafaudage fait main n'avait rien de tout ça.
 *
 * La définition vivait sur une carte permanente de l'écran de jeu, ce qui
 * revenait à souffler la réponse à un joueur censé taper le mot sans aide.
 * Elle est ici, derrière une demande explicite, comptée comme un indice.
 */
export function HintsModal({ onClose, onHint, targetWord }: HintsModalProps) {
  const { locale } = useApp()
  const [showDefinition, setShowDefinition] = useState(false)

  // Les deux autres indices agissent sur la partie puis referment la feuille ;
  // celui-ci n'a rien à révéler ailleurs qu'ici, donc elle reste ouverte.
  const revealDefinition = () => {
    onHint("definition")
    setShowDefinition(true)
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-[20px] bg-[#F8F8F8] pb-[env(safe-area-inset-bottom)]"
      >
        {/* Poignée de glissement, comme sur la feuille d'earthunt. */}
        <div className="mx-auto mt-2 h-1 w-12 shrink-0 rounded-full bg-[#0A3D62]/20" />

        <SheetHeader className="pb-0">
          <SheetTitle className="text-lg font-bold text-[#0A3D62]">
            {showDefinition ? t(locale, "definition") : t(locale, "hints")}
          </SheetTitle>
          <SheetDescription className="text-sm text-[#50555C]">
            {showDefinition ? t(locale, "findTheWord") : t(locale, "tapHint")}
          </SheetDescription>
        </SheetHeader>

        {showDefinition ? (
          <div className="flex flex-col gap-3 px-4">
            <p className="rounded-2xl bg-[#6B4FA0]/10 p-4 text-sm leading-relaxed text-[#333]">
              {getDefinition(targetWord ?? "", locale)}
            </p>
            <button
              onClick={() => setShowDefinition(false)}
              className="self-start rounded-xl px-2 py-2 text-sm font-semibold text-[#1D70A2] active:bg-[#1D70A2]/10"
            >
              {t(locale, "backToHints")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-4">
            <HintChoice
              icon={Type}
              color="#1D70A2"
              title={t(locale, "firstLetter")}
              description={
                locale === "en"
                  ? "Reveals the first letter of the word"
                  : "Revele la premiere lettre du mot"
              }
              onClick={() => onHint("firstLetter")}
            />
            <HintChoice
              icon={Eye}
              color="#D4782F"
              title={t(locale, "fullWord")}
              description={
                locale === "en" ? "Skips to the next word" : "Passe au mot suivant"
              }
              onClick={() => onHint("fullWord")}
            />
            <HintChoice
              icon={BookOpen}
              color="#6B4FA0"
              title={t(locale, "definition")}
              description={t(locale, "definitionHintDesc")}
              onClick={revealDefinition}
              // Le bouton d'indices reste ouvrable pendant les 600 ms qui
              // séparent le dernier mot trouvé de la modale de réussite, et il
              // n'y a alors plus de barreau à définir.
              disabled={!targetWord}
            />
          </div>
        )}

        <SheetFooter>
          <Button size="lg" className="w-full" onClick={onClose}>
            {t(locale, "backToGame")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
