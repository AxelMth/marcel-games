"use client"

import { useEffect, useState } from "react"
import { Loader2, Star, Medal } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@marcel-games/ui"
import { useLanguage } from "@/components/language-provider"
import { getProfile, type ProfileResponse } from "@/lib/api"

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
}

function formatGameMode(mode: string, continent: string): string {
  if (mode === "LEVEL_OF_THE_DAY") return "Daily"
  if (mode === "WORLD") return "World"
  if (mode === "CONTINENTS") return continent === "WORLD" ? "World" : continent
  return mode
}

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) return <Medal className="h-4 w-4 text-amber-500" aria-label="1st" />
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-400" aria-label="2nd" />
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-700" aria-label="3rd" />
  return <span className="text-[#0f2b3c]/80">#{rank}</span>
}

export function ProfileModal({ open, onOpenChange, userId }: ProfileModalProps) {
  const { t } = useLanguage()
  const [data, setData] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !userId) {
      if (!open) setData(null)
      return
    }
    setLoading(true)
    setError(null)
    getProfile(userId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false))
  }, [open, userId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0f2b3c]">
            {t("profile.stats")}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#0f2b3c]" />
              <span className="text-sm font-medium text-[#0f2b3c]/80">
                {t("profile.loading")}
              </span>
            </div>
          )}
          {error && (
            <p className="text-center text-sm font-medium text-red-600">
              {error}
            </p>
          )}
          {!loading && !error && !userId && (
            <p className="py-4 text-center text-sm text-[#0f2b3c]/70">
              {t("profile.noUser")}
            </p>
          )}
          {!loading && !error && userId && data && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-[#0f2b3c]/10 p-4 text-center">
                  <p className="text-2xl font-bold text-[#0f2b3c]">
                    {data.stats.dailyLevelsCompleted}
                  </p>
                  <p className="text-xs font-medium text-[#0f2b3c]/80">
                    {t("profile.daysCompleted")}
                  </p>
                </div>
                <div className="rounded-xl bg-[#0f2b3c]/10 p-4 text-center">
                  <p className="text-2xl font-bold text-[#0f2b3c]">
                    #{data.stats.lastLevelRank}
                  </p>
                  <p className="text-xs font-medium text-[#0f2b3c]/80">
                    {t("profile.todaysRank")}
                  </p>
                </div>
                <div className="rounded-xl bg-[#0f2b3c]/10 p-4 text-center">
                  <p className="text-2xl font-bold text-[#0f2b3c]">
                    #{data.stats.globalRank}
                  </p>
                  <p className="text-xs font-medium text-[#0f2b3c]/80">
                    {t("profile.globalRank")}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-[#0f2b3c]">
                  {t("profile.gameHistory")}
                </h3>
                {data.gameHistory.length === 0 ? (
                  <p className="py-4 text-center text-sm text-[#0f2b3c]/70">
                    {t("profile.noHistory")}
                  </p>
                ) : (
                  <ul className="max-h-48 space-y-2 overflow-y-auto">
                    {data.gameHistory.map((entry, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-2 rounded-lg bg-[#0f2b3c]/5 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-[#0f2b3c]">
                          {formatGameMode(entry.gameMode, entry.continent)} Lvl{" "}
                          {entry.level}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3].map((s) => (
                              <Star
                                key={s}
                                className={`h-3.5 w-3.5 ${
                                  s <= entry.stars
                                    ? "fill-[#f0a830] text-[#f0a830]"
                                    : "fill-none text-[#b0d8e4]"
                                }`}
                                strokeWidth={1.5}
                              />
                            ))}
                          </div>
                          <RankDisplay rank={entry.rank} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
