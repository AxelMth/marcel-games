"use client"

import { BookOpen, ArrowUpDown, Lightbulb } from "lucide-react"
import {
  Button,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@marcel-games/ui"
import { useApp } from "@/lib/app-context"
import { t } from "@/lib/i18n"

interface HelpModalProps {
  onClose: () => void
}

/** L'échelle d'exemple. Les deux extrémités sont données, le reste se trouve. */
const EXAMPLE = [
  { word: "COLD", given: true },
  { word: "CORD", given: false },
  { word: "CARD", given: false },
  { word: "WARD", given: true },
]

export function HelpModal({ onClose }: HelpModalProps) {
  const { locale } = useApp()

  const rules = [
    { icon: BookOpen, text: t(locale, "helpRule1"), color: "#1D70A2" },
    { icon: ArrowUpDown, text: t(locale, "helpRule2"), color: "#2E8B57" },
    { icon: Lightbulb, text: t(locale, "helpRule3"), color: "#D4782F" },
  ]

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-[20px] bg-[#F8F8F8] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto mt-2 h-1 w-12 shrink-0 rounded-full bg-[#0A3D62]/20" />

        <SheetHeader className="pb-0">
          <SheetTitle className="text-lg font-bold text-[#0A3D62]">
            {t(locale, "helpTitle")}
          </SheetTitle>
        </SheetHeader>

        <div className="px-4">
          <div className="flex flex-col gap-4">
            {rules.map((rule, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${rule.color}26` }}
                >
                  <rule.icon size={16} style={{ color: rule.color }} />
                </div>
                <p className="text-sm leading-relaxed text-[#50555C]">{rule.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl bg-[#1D70A2]/10 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#1D70A2]">
              {locale === "en" ? "Example" : "Exemple"}
            </p>
            {/* Les mêmes couleurs que le plateau : bleu pour un mot donné, vert
                pour un mot trouvé. L'exemple ment moins s'il se lit comme le
                jeu. */}
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              {EXAMPLE.map(({ word, given }, i) => (
                <span key={word} className="flex items-center gap-2">
                  {i > 0 && <span className="text-[#0A3D62]/25">{">"}</span>}
                  <span
                    className={`rounded-lg px-2 py-1 text-xs text-[#F8F8F8] ${
                      given ? "bg-[#1D70A2]" : "bg-[#2E8B57]"
                    }`}
                  >
                    {word}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button size="lg" className="w-full" onClick={onClose}>
            {t(locale, "understand")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
