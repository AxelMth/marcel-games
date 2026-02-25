"use client";

import { MapPin, Trophy, Globe, Compass } from "lucide-react";

export function HomeScreen() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-background px-6 pb-10 pt-safe">
      {/* Header */}
      <header className="w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Compass className="h-7 w-7 text-primary" />
          <span className="text-xl font-mono font-bold tracking-wider text-foreground">
            EARTHUNT
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
          <Globe className="h-16 w-16 text-primary" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground">
            Hunt the Earth
          </h1>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground">
            Race to find hidden locations scattered across the globe before
            anyone else does.
          </p>
        </div>

        <button className="mt-2 flex w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-base font-semibold text-primary-foreground transition-opacity active:opacity-80">
          <MapPin className="h-5 w-5" />
          Start Hunting
        </button>
      </section>

      {/* Stats row */}
      <section
        aria-label="Quick stats"
        className="grid w-full max-w-sm grid-cols-3 gap-3"
      >
        {[
          { label: "Locations", value: "2,400+" },
          { label: "Players", value: "18K" },
          { label: "Countries", value: "120" },
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
