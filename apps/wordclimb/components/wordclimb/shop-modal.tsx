"use client"

import { Coins, Gift } from "lucide-react"
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
import { WEEKLY_COIN_ALLOWANCE } from "@/lib/coins"

interface ShopModalProps {
  onClose: () => void
  coins: number
}

/**
 * Où trouver des pièces quand il n'y en a plus.
 *
 * Le seul moyen d'en obtenir aujourd'hui est la recharge hebdomadaire, et
 * c'est ce que la feuille dit en premier : un joueur à sec doit savoir que la
 * situation se règle d'elle-même, pas rester devant un mur.
 *
 * L'achat est affiché mais désactivé. Le brancher demande des produits
 * déclarés sur les deux stores et une validation de reçus côté serveur —
 * un chantier à part. Le montrer inerte plutôt que le cacher, parce que le
 * joueur qui vient chercher des pièces mérite de savoir que la suite existe.
 */
export function ShopModal({ onClose, coins }: ShopModalProps) {
  const { locale } = useApp()

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-[20px] bg-[#F8F8F8] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto mt-2 h-1 w-12 shrink-0 rounded-full bg-[#0A3D62]/20" />

        <SheetHeader className="pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="text-lg font-bold text-[#0A3D62]">
                {t(locale, "shopTitle")}
              </SheetTitle>
              <SheetDescription className="text-sm text-[#50555C]">
                {t(locale, "coinBalance")}
              </SheetDescription>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#D4782F]/10 px-3 py-1.5 text-sm font-bold text-[#D4782F]">
              <Coins size={16} />
              {coins}
            </span>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4">
          <div className="flex items-center gap-3 rounded-2xl bg-[#2E8B57]/10 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2E8B57]/15">
              <Gift size={20} className="text-[#2E8B57]" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-[#0A3D62]">
                {t(locale, "weeklyRefill")}
              </span>
              <p className="mt-0.5 text-xs text-[#50555C]">
                {locale === "en"
                  ? `Your balance is topped back up to ${WEEKLY_COIN_ALLOWANCE} at the start of each week.`
                  : `Ton solde remonte a ${WEEKLY_COIN_ALLOWANCE} au debut de chaque semaine.`}
              </p>
            </div>
          </div>

          <button
            disabled
            className="flex items-center gap-3 rounded-2xl bg-[#D4782F]/10 p-4 text-left opacity-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4782F]/15">
              <Coins size={20} className="text-[#D4782F]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold text-[#0A3D62]">
                {t(locale, "coinPack")}
              </span>
              <p className="mt-0.5 text-xs text-[#50555C]">
                {t(locale, "comingSoon")}
              </p>
            </div>
          </button>
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
