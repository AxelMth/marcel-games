"use client"

import { cn } from "@/lib/utils"

interface LetterBoxProps {
  letter: string
  state: "given" | "found" | "current" | "hidden"
  highlight?: boolean
}

export function LetterBox({ letter, state, highlight }: LetterBoxProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center w-10 h-10 rounded-lg text-lg font-bold uppercase transition-all duration-300 select-none border-2",
        state === "given" &&
          "bg-[#1D70A2] text-[#F8F8F8] border-[#1D70A2] shadow-sm",
        state === "found" &&
          "bg-[#2E8B57] text-[#F8F8F8] border-[#2E8B57] shadow-sm",
        state === "current" &&
          "bg-[#F0F0F0] text-[#1D70A2] border-[#1D70A2] shadow-md",
        state === "hidden" &&
          "bg-[#E8E8E8] text-[#E8E8E8] border-[#D0D0D0]",
        highlight && state === "current" && "animate-pulse border-[#D4782F]"
      )}
    >
      {state === "hidden" ? "?" : letter}
    </div>
  )
}
