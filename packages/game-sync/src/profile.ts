import { isCount, isRecord } from "./http"

export interface ProfileStats {
  dailyLevelsCompleted: number
  /** Rank on the last daily challenge played, 0 when not ranked. */
  lastLevelRank: number
  /** Rank over every daily challenge, 0 when not ranked. */
  globalRank: number
}

/** What GET /profile answers: the player's ranks and their last levels, newest first. */
export interface Profile<Entry> {
  stats: ProfileStats
  history: Entry[]
}

/** Fields both games' history entries carry. */
export interface HistoryBase {
  level: number
  gameMode: string
  stars: number
  /** 0 when not ranked. */
  rank: number
}

export function isHistoryBase(value: unknown): value is HistoryBase {
  return (
    isRecord(value) &&
    isCount(value.level) &&
    typeof value.gameMode === "string" &&
    isCount(value.stars) &&
    isCount(value.rank)
  )
}

/** Entries the client cannot read are left out rather than failing the whole screen. */
export function parseProfile<Entry>(
  data: unknown,
  isEntry: (value: unknown) => value is Entry
): Profile<Entry> {
  if (!isRecord(data) || !isRecord(data.stats)) throw new Error("The profile carries no stats")
  const { dailyLevelsCompleted, lastLevelRank, globalRank } = data.stats
  if (!isCount(dailyLevelsCompleted) || !isCount(lastLevelRank) || !isCount(globalRank)) {
    throw new Error("The profile stats are not counts")
  }
  const history = Array.isArray(data.gameHistory) ? data.gameHistory.filter(isEntry) : []
  return { stats: { dailyLevelsCompleted, lastLevelRank, globalRank }, history }
}
