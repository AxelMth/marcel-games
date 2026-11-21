import { isCount, isRecord } from "./http"

/** Where the player stands in the daily challenge. A rank of 0 means not ranked. */
export interface DailyStats {
  completed: number
  todayRank: number
  globalRank: number
}

/**
 * The daily challenge as the device knows it for one UTC day.
 *
 * `puzzle` is null when the server has not handed one out: the day is done, or
 * it could not be asked and the game falls back on the puzzle it builds itself.
 */
export interface Daily<Puzzle> {
  /** The UTC day this describes, as YYYY-MM-DD. */
  day: string
  puzzle: Puzzle | null
  done: boolean
  stats: DailyStats | null
}

/** The daily challenge turns over at midnight UTC on the server. */
export function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Reads the `stats` field of a server answer, or null when it carries none. */
export function parseDailyStats(data: unknown): DailyStats | null {
  if (
    !isRecord(data) ||
    !isCount(data.dailyLevelsCompleted) ||
    !isCount(data.lastLevelRank) ||
    !isCount(data.globalRank)
  ) {
    return null
  }
  return {
    completed: data.dailyLevelsCompleted,
    todayRank: data.lastLevelRank,
    globalRank: data.globalRank,
  }
}

function isStats(value: unknown): value is DailyStats {
  return (
    isRecord(value) &&
    isCount(value.completed) &&
    isCount(value.todayRank) &&
    isCount(value.globalRank)
  )
}

export function isDaily<Puzzle>(
  value: unknown,
  isPuzzle: (puzzle: unknown) => puzzle is Puzzle
): value is Daily<Puzzle> {
  return (
    isRecord(value) &&
    typeof value.day === "string" &&
    typeof value.done === "boolean" &&
    (value.puzzle === null || isPuzzle(value.puzzle)) &&
    (value.stats === null || isStats(value.stats))
  )
}

/** What the server answered when asked for today's challenge. An absent puzzle means done. */
export interface DailyAnswer<Puzzle> {
  puzzle: Puzzle | null
  stats: DailyStats | null
}

/**
 * Folds a server answer into what the device knew. A day finished on the device
 * stays finished even if the server has not received the result yet.
 */
export function dailyFromServer<Puzzle>(
  known: Daily<Puzzle> | null,
  day: string,
  answer: DailyAnswer<Puzzle>
): Daily<Puzzle> {
  const doneHere = known?.day === day && known.done
  return {
    day,
    puzzle: answer.puzzle,
    done: doneHere || answer.puzzle === null,
    stats: answer.stats,
  }
}

/** The day once its challenge is finished on the device. The rank comes later, from the server. */
export function dailyDone<Puzzle>(known: Daily<Puzzle> | null, day: string): Daily<Puzzle> {
  const today = known?.day === day ? known : null
  return { day, puzzle: today?.puzzle ?? null, done: true, stats: today?.stats ?? null }
}
