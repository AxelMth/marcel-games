"use client"

import { useEffect, useState } from "react"
import { useGameStore } from "@/lib/game-store"
import { useLanguage } from "./language-provider"
import { getProfile, type ProfileResponse } from "@/lib/api"

export function StatsScreen() {
  const { t } = useLanguage()
  const userId = useGameStore((s) => s.userId)
  const goHome = useGameStore((s) => s.goHome)
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    getProfile(userId)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  return (
    <main className="flex min-h-screen flex-col bg-background px-4 py-6">
      <header className="flex items-center justify-between">
        <button onClick={goHome} className="text-sm text-muted-foreground">
          {"<"} Back
        </button>
        <h2 className="text-xl font-bold text-foreground">Stats</h2>
        <div className="w-10" />
      </header>

      {loading ? (
        <p className="mt-20 text-center text-muted-foreground">{t("profile.loading")}</p>
      ) : !profile ? (
        <p className="mt-20 text-center text-muted-foreground">No data yet</p>
      ) : (
        <>
          {/* Summary */}
          <section className="mt-8 flex justify-around rounded-2xl bg-card p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {profile.stats.dailyLevelsCompleted}
              </p>
              <p className="text-xs text-muted-foreground">Daily levels</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">
                #{profile.stats.globalRank || "-"}
              </p>
              <p className="text-xs text-muted-foreground">Global rank</p>
            </div>
          </section>

          {/* History */}
          <h3 className="mb-3 mt-8 text-lg font-bold text-foreground">History</h3>
          <div className="flex flex-col gap-2">
            {profile.gameHistory.length === 0 && (
              <p className="text-sm text-muted-foreground">No games played yet</p>
            )}
            {profile.gameHistory.map((entry, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {entry.gameMode} {entry.continent ? `- ${entry.continent}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">Level {entry.level}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-accent">
                    {"★".repeat(entry.stars)}
                    {"☆".repeat(3 - entry.stars)}
                  </span>
                  {entry.rank > 0 && (
                    <span className="text-xs text-muted-foreground">#{entry.rank}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
