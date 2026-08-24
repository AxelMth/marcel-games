import type { TourId } from "./tour-storage"

/**
 * Where the explanation bubble sits relative to the highlighted element.
 * "auto" puts it on whichever side has more room, which is what most steps want.
 */
export type TourPlacement = "auto" | "above" | "below"

export interface TourStep {
  /**
   * Value of the `data-tour` attribute on the element to highlight.
   *
   * Targets are addressed by attribute rather than by React ref on purpose: the
   * elements live in four unrelated components, so refs would mean threading
   * context through all of them, while an attribute is inert and removable
   * without touching behaviour.
   */
  target: string
  titleKey: string
  descKey: string
  placement?: TourPlacement
  /** Extra room around the element, in px, so the cutout does not crop shadows. */
  padding?: number
}

/**
 * The steps span two screens — choosing a mode happens on the home screen, the
 * rest inside a level — and a spotlight cannot point at a home element while
 * the player is playing. Hence two tours, each triggered on its own screen.
 */
export const TOURS: Record<TourId, TourStep[]> = {
  home: [
    {
      target: "mode-card",
      titleKey: "tour.home.modes",
      descKey: "tour.home.modesDesc",
      placement: "below",
      padding: 4,
    },
    {
      target: "mode-next",
      titleKey: "tour.home.switch",
      descKey: "tour.home.switchDesc",
      placement: "below",
    },
    {
      target: "stats-cog",
      titleKey: "tour.home.stats",
      descKey: "tour.home.statsDesc",
      placement: "below",
    },
  ],
  game: [
    {
      target: "game-indicator",
      titleKey: "tour.game.goal",
      descKey: "tour.game.goalDesc",
      placement: "below",
    },
    {
      target: "search-bar",
      titleKey: "tour.game.search",
      descKey: "tour.game.searchDesc",
      placement: "above",
    },
    {
      target: "help-bubble",
      titleKey: "tour.game.hints",
      descKey: "tour.game.hintsDesc",
      placement: "above",
    },
  ],
}
