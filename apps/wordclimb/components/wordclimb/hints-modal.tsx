"use client"

import { Type, Eye } from "lucide-react"
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
import { HintChoice } from "./hint-choice"

interface HintsModalProps {
  onClose: () => void
  onHint: (type: "firstLetter" | "fullWord") => void | Promise<void>
}

/**
 * Une feuille Radix, pas un div : c'est la même fonction, sur le même geste,
 * qu'earthunt rend avec ce composant (hints-help-sheet.tsx). Ce qu'on gagne au
 * passage n'est pas cosmétique — Échap ferme, le focus est piégé dans la
 * feuille, le fond ne défile plus derrière, et le rôle de dialogue est annoncé.
 * L'échafaudage fait main n'avait rien de tout ça.
 */
export function HintsModal({ onClose, onHint }: HintsModalProps) {
  const { locale } = useApp()

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
            {t(locale, "hints")}
          </SheetTitle>
          <SheetDescription className="text-sm text-[#50555C]">
            {t(locale, "tapHint")}
          </SheetDescription>
        </SheetHeader>

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
        </div>

        <SheetFooter>
          <Button size="lg" className="w-full" onClick={onClose}>
            {t(locale, "backToGame")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
