"use client"

import { Coins, type LucideIcon } from "lucide-react"

interface HintChoiceProps {
  icon: LucideIcon
  /** Teinte de l'indice ; la pastille et le fond en dérivent. */
  color: string
  title: string
  description: string
  onClick: () => void
  disabled?: boolean
  /** Prix en pièces, affiché à droite. */
  cost?: number
  /** Le joueur n'a pas de quoi payer : le prix passe en rouge. */
  unaffordable?: boolean
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
  cost,
  unaffordable,
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
      <div className="min-w-0 flex-1">
        <span className="text-sm font-bold text-[#0A3D62]">{title}</span>
        <p className="mt-0.5 text-xs text-[#50555C]">{description}</p>
      </div>
      {cost !== undefined && (
        // Le prix se lit avant d'appuyer : un indice qui coûte trois fois les
        // autres ne doit pas se découvrir une fois payé.
        <span
          className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
            unaffordable
              ? "bg-[#DC3545]/10 text-[#DC3545]"
              : "bg-[#D4782F]/10 text-[#D4782F]"
          }`}
        >
          <Coins size={12} />
          {cost}
        </span>
      )}
    </button>
  )
}
