import type { Continent } from "@marcel-games/earthunt-core"

export const CONTINENT_COLORS: Record<string, string | undefined> = {
  EUROPE: "#3D6FD8",
  ASIA: "#C9463C",
  AMERICAS: "#B4701A",
  AFRICA: "#7D4FC4",
  OCEANIA: "#1E8C80",
} satisfies Partial<Record<Continent, string>>
