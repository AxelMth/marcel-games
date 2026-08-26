"use client"

import type { LucideIcon } from "lucide-react"

interface HintChoiceProps {
  icon: LucideIcon
  /** Teinte de l'indice ; la pastille et le fond en dérivent. */
  color: string
  title: string
  description: string
  onClick: () => void
  disabled?: boolean
}

/**
 * Une ligne d'indice : pastille colorée, titre, explication.
 *
 * La même rangée était écrite quatre fois — deux dans la feuille d'indices,
 * deux dans celle d'aide — avec à chaque fois la couleur recopiée à trois
 * endroits (fond au repos, au survol, à l'appui) sous forme de rgba() écrits à
 * la main. Une seule teinte en entrée, et les trois états en dérivent.
 */
export function HintChoice({
  icon: Icon,
  color,
  title,
  description,
  onClick,
  disabled,
}: HintChoiceProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 rounded-2xl p-4 text-left transition-colors disabled:opacity-50"
      style={{ backgroundColor: `${color}14` }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}26` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div className="min-w-0">
        <span className="text-sm font-bold text-[#0A3D62]">{title}</span>
        <p className="mt-0.5 text-xs text-[#50555C]">{description}</p>
      </div>
    </button>
  )
}
