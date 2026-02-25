"use client";

import { BookOpen, Trophy, Layers, ChevronUp } from "lucide-react";

export function HomeScreen() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-background px-6 pb-10 pt-safe">
      {/* Header */}
      <header className="w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <ChevronUp className="h-7 w-7 text-primary" />
          <span className="text-xl font-mono font-bold tracking-wider text-foreground">
            WORDCLIMB
          </span>
        </div>
        <button
          aria-label="Leaderboard"
          className="rounded-full bg-secondary p-2 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Trophy className="h-5 w-5" />
        </button>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/40">
          <Layers className="h-16 w-16 text-primary" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground">
            Climb the Ladder
          </h1>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground">
            Solve word puzzles, earn points, and ascend the global leaderboard
            one letter at a time.
          </p>
        </div>

        <button className="mt-2 flex w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-base font-semibold text-primary-foreground transition-opacity active:opacity-80">
          <BookOpen className="h-5 w-5" />
          Play Now
        </button>
      </section>

      {/* Stats row */}
      <section
        aria-label="Quick stats"
        className="grid w-full max-w-sm grid-cols-3 gap-3"
      >
        {[
          { label: "Puzzles", value: "1,800+" },
          { label: "Players", value: "32K" },
          { label: "Languages", value: "8" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center rounded-lg bg-card px-3 py-4"
          >
            <span className="text-2xl font-bold text-primary">{stat.value}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
