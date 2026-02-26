"use client"

import { LetterBox } from "./letter-box"

interface WordRowProps {
  word: string
  state: "given" | "found" | "current" | "hidden"
  highlight?: boolean
  label?: string
}

export function WordRow({ word, state, highlight, label }: WordRowProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#50555C] opacity-70">
          {label}
        </span>
      )}
      <div className="flex gap-1.5">
        {word.split("").map((letter, i) => (
          <LetterBox
            key={`${i}-${letter}`}
            letter={letter}
            state={state}
            highlight={highlight && i === 0}
          />
        ))}
      </div>
    </div>
  )
}
