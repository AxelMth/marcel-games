"use client"

import { X, Type, Eye } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { t } from "@/lib/i18n"

interface HintsModalProps {
  onClose: () => void
  onHint: (type: "firstLetter" | "fullWord") => void
}

export function HintsModal({ onClose, onHint }: HintsModalProps) {
  const { locale } = useApp()

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.5)] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-[20px] bg-[#F8F8F8] shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0]">
          <h2 className="text-lg font-bold text-[#0A3D62]">{t(locale, "hints")}</h2>
          <button
            onClick={onClose}
            className="text-[#50555C] hover:text-[#0A3D62] transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-5">
          <p className="text-sm text-[#50555C] mb-4">{t(locale, "tapHint")}</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => onHint("firstLetter")}
              className="flex items-center gap-3 rounded-2xl bg-[rgba(29,112,162,0.08)] p-4 text-left transition-colors hover:bg-[rgba(29,112,162,0.15)] active:bg-[rgba(29,112,162,0.2)]"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1D70A2] bg-opacity-15">
                <Type size={20} className="text-[#1D70A2]" />
              </div>
              <div>
                <span className="text-sm font-bold text-[#0A3D62]">
                  {t(locale, "firstLetter")}
                </span>
                <p className="text-xs text-[#50555C] mt-0.5">
                  {locale === "en"
                    ? "Reveals the first letter of the word"
                    : "Revele la premiere lettre du mot"}
                </p>
              </div>
            </button>

            <button
              onClick={() => onHint("fullWord")}
              className="flex items-center gap-3 rounded-2xl bg-[rgba(212,120,47,0.08)] p-4 text-left transition-colors hover:bg-[rgba(212,120,47,0.15)] active:bg-[rgba(212,120,47,0.2)]"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#D4782F] bg-opacity-15">
                <Eye size={20} className="text-[#D4782F]" />
              </div>
              <div>
                <span className="text-sm font-bold text-[#0A3D62]">
                  {t(locale, "fullWord")}
                </span>
                <p className="text-xs text-[#50555C] mt-0.5">
                  {locale === "en"
                    ? "Skips to the next word"
                    : "Passe au mot suivant"}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#E0E0E0]">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[#1D70A2] py-2.5 text-sm font-bold text-[#F8F8F8] shadow-sm transition-colors hover:bg-[#165d8a]"
          >
            {t(locale, "backToGame")}
          </button>
        </div>
      </div>
    </div>
  )
}
