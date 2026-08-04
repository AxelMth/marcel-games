/**
 * Remembers which guided tours a player has already been shown.
 *
 * Keys carry a version so a redesign can re-introduce a tour to players who saw
 * the old one, without also replaying every other tour.
 */

export type TourId = "home" | "game"

/** Bump the version of a tour whose steps or targets have meaningfully changed. */
export const TOUR_VERSIONS: Record<TourId, number> = {
  home: 1,
  game: 1,
}

const STORAGE_PREFIX = "earthunt-tour-"

function storageKey(tour: TourId): string {
  return `${STORAGE_PREFIX}${tour}-v${TOUR_VERSIONS[tour]}`
}

/**
 * True when this exact version of the tour has already been completed or
 * skipped. A storage failure — Safari private mode throws on write — reads as
 * "already seen": showing the tour on every single launch is far worse than
 * never showing it.
 */
export function hasSeenTour(tour: TourId): boolean {
  if (typeof window === "undefined") return true
  try {
    return localStorage.getItem(storageKey(tour)) !== null
  } catch {
    return true
  }
}

export function markTourSeen(tour: TourId): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(storageKey(tour), String(Date.now()))
  } catch {
    // Nothing to do: the tour simply runs again next launch.
  }
}

/**
 * Forgets a tour so it plays again. Backs the "replay the tutorial" entry in
 * the how-to-play sheet.
 */
export function resetTour(tour: TourId): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(storageKey(tour))
  } catch {
    // Ignored: the replay simply does not stick.
  }
}
