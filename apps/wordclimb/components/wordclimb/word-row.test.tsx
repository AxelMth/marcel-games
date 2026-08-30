import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { WordRow } from "./word-row"

/**
 * The two feedback shapes carry different meanings, and the difference is the
 * point: a solved word lights up left to right, so it reads as the word being
 * accepted, while a refused one flashes as a single block, so it reads as one
 * rejected guess rather than one wrong letter.
 */
describe("WordRow feedback", () => {
  it("lights a solved word up letter by letter", () => {
    const { container } = render(
      <WordRow word="bank" state="found" animation="success" />
    )

    const lit = container.querySelectorAll(".wc-letter-found")
    expect(lit).toHaveLength(4)
    // 70ms between letters, so the run reads left to right.
    expect((lit[0] as HTMLElement).style.animationDelay).toBe("")
    expect((lit[1] as HTMLElement).style.animationDelay).toBe("70ms")
    expect((lit[3] as HTMLElement).style.animationDelay).toBe("210ms")
    expect(container.querySelector(".wc-row-shake")).toBeNull()
  })

  it("flashes a refused guess all at once, and shakes the row", () => {
    const { container } = render(
      <WordRow word="bank" state="current" typed="zzzz" animation="error" />
    )

    const flashed = container.querySelectorAll(".wc-letter-wrong")
    expect(flashed).toHaveLength(4)
    for (const box of flashed) {
      expect((box as HTMLElement).style.animationDelay).toBe("")
    }
    // The shake belongs to the row: moving each box on its own would pull the
    // word apart instead of rejecting it as one guess.
    expect(container.querySelector(".wc-row-shake")).not.toBeNull()
  })

  it("shows the letters the player typed, not the answer, while refusing", () => {
    // The refused guess has to stay readable — that is the whole reason the
    // row is not cleared on the spot.
    const { container } = render(
      <WordRow word="bank" state="current" typed="zzzz" animation="error" />
    )
    expect(container.textContent).toBe("zzzz")
  })

  it("stands the caret pulse down while feedback is playing", () => {
    // Both want the same border colour; the pulse would fight the flash.
    const { container } = render(
      <WordRow word="bank" state="current" typed="zz" highlight animation="error" />
    )
    expect(container.querySelector(".animate-pulse")).toBeNull()
  })

  it("keeps the caret pulse when nothing is animating", () => {
    const { container } = render(
      <WordRow word="bank" state="current" typed="zz" highlight />
    )
    expect(container.querySelector(".animate-pulse")).not.toBeNull()
  })
})
