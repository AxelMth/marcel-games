"use client"

import { useState } from "react"
import { Type, Eye, BookOpen, Coins } from "lucide-react"
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
import { getDefinition, hasDefinition } from "@/lib/data/definitions"
import { HINT_COSTS } from "@/lib/coins"
import { HintChoice } from "./hint-choice"

interface HintsModalProps {
  onClose: () => void
  onHint: (type: "firstLetter" | "fullWord" | "definition") => void | Promise<void>
  /** Le barreau en cours. Absent une fois le niveau fini. */
  targetWord: string | undefined
  /** Solde courant, passé par l'écran de jeu qui le tient à jour. */
  coins: number
  onOpenShop: () => void
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
export function HintsModal({
  onClose,
  onHint,
  targetWord,
  coins,
  onOpenShop,
}: HintsModalProps) {
  const { locale } = useApp()
  const [showDefinition, setShowDefinition] = useState(false)
  const cannotAffordAny = coins < Math.min(...Object.values(HINT_COSTS))

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
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="text-lg font-bold text-[#0A3D62]">
                {showDefinition ? t(locale, "definition") : t(locale, "hints")}
              </SheetTitle>
              <SheetDescription className="text-sm text-[#50555C]">
                {showDefinition ? t(locale, "findTheWord") : t(locale, "tapHint")}
              </SheetDescription>
            </div>
            {/* Le solde vit ici, pas dans l'en-tête du jeu : c'est le seul
                endroit où on dépense, et l'écran de jeu reste épuré. */}
            <span
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#D4782F]/10 px-3 py-1.5 text-sm font-bold text-[#D4782F]"
              aria-label={t(locale, "coinBalance")}
            >
              <Coins size={16} />
              {coins}
            </span>
          </div>
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
              cost={HINT_COSTS.firstLetter}
              unaffordable={coins < HINT_COSTS.firstLetter}
              disabled={coins < HINT_COSTS.firstLetter}
            />
            <HintChoice
              icon={Eye}
              color="#D4782F"
              title={t(locale, "fullWord")}
              description={
                locale === "en" ? "Skips to the next word" : "Passe au mot suivant"
              }
              onClick={() => onHint("fullWord")}
              cost={HINT_COSTS.fullWord}
              unaffordable={coins < HINT_COSTS.fullWord}
              disabled={coins < HINT_COSTS.fullWord}
            />
            <HintChoice
              icon={BookOpen}
              color="#6B4FA0"
              title={t(locale, "definition")}
              description={t(locale, "definitionHintDesc")}
              onClick={revealDefinition}
              // Rien à vendre quand il n'y a pas de barreau : la feuille reste
              // ouvrable pendant les 600 ms qui séparent le dernier mot trouvé
              // de la modale de réussite. Le générateur exige désormais une
              // entrée Wiktionnaire pour qu'un mot entre dans le catalogue,
              // donc un barreau sans définition ne devrait plus exister — ce
              // garde reste la ceinture si ce filtre lâchait.
              disabled={
                !hasDefinition(targetWord, locale) ||
                coins < HINT_COSTS.definition
              }
              cost={HINT_COSTS.definition}
              unaffordable={coins < HINT_COSTS.definition}
            />

            {cannotAffordAny && (
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#0A3D62]/5 p-4 text-center">
                <p className="text-sm font-semibold text-[#0A3D62]">
                  {t(locale, "notEnoughCoins")}
                </p>
                <button
                  onClick={onOpenShop}
                  className="rounded-xl bg-[#D4782F] px-4 py-2 text-sm font-bold text-white active:opacity-80"
                >
                  {t(locale, "recharge")}
                </button>
              </div>
            )}
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
