"use client"

import { X, BookOpen, ArrowUpDown, Lightbulb } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { t } from "@/lib/i18n"

interface HelpModalProps {
  onClose: () => void
}

export function HelpModal({ onClose }: HelpModalProps) {
  const { locale } = useApp()

  const rules = [
    {
      icon: BookOpen,
      text: t(locale, "helpRule1"),
      color: "#1D70A2",
    },
    {
      icon: ArrowUpDown,
      text: t(locale, "helpRule2"),
      color: "#2E8B57",
    },
    {
      icon: Lightbulb,
      text: t(locale, "helpRule3"),
      color: "#D4782F",
    },
  ]

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
          <h2 className="text-lg font-bold text-[#0A3D62]">{t(locale, "helpTitle")}</h2>
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
          <div className="flex flex-col gap-4">
            {rules.map((rule, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: `${rule.color}15` }}
                >
                  <rule.icon size={16} style={{ color: rule.color }} />
                </div>
                <p className="text-sm text-[#333] leading-relaxed">{rule.text}</p>
              </div>
            ))}
          </div>

          {/* Example */}
          <div className="mt-5 rounded-2xl bg-[rgba(29,112,162,0.06)] p-4">
            <p className="text-xs font-bold text-[#1D70A2] uppercase tracking-wider mb-2">
              {locale === "en" ? "Example" : "Exemple"}
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#333]">
              <span className="px-2 py-1 rounded-lg bg-[#1D70A2] text-[#F8F8F8] text-xs">COLD</span>
              <span className="text-[#D0D0D0]">{">"}</span>
              <span className="px-2 py-1 rounded-lg bg-[#2E8B57] text-[#F8F8F8] text-xs">CORD</span>
              <span className="text-[#D0D0D0]">{">"}</span>
              <span className="px-2 py-1 rounded-lg bg-[#2E8B57] text-[#F8F8F8] text-xs">CARD</span>
              <span className="text-[#D0D0D0]">{">"}</span>
              <span className="px-2 py-1 rounded-lg bg-[#1D70A2] text-[#F8F8F8] text-xs">WARD</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#E0E0E0]">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[#1D70A2] py-2.5 text-sm font-bold text-[#F8F8F8] shadow-sm transition-colors hover:bg-[#165d8a]"
          >
            {t(locale, "understand")}
          </button>
        </div>
      </div>
    </div>
  )
}
