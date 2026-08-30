/**
 * Seeded randomness for the catalogue pipeline.
 *
 * Every shuffle that decides what the player sees runs through here, and every
 * one of them is seeded. Two reasons, both hard requirements:
 *
 * - The catalogue is emitted twice, once for the client bundle and once for the
 *   server's Postgres seed. They must agree level for level, or "level 12"
 *   means two different puzzles depending on whether the player is online.
 * - A rebuild that reshuffled everything would move every level number under
 *   the players already partway through the catalogue.
 */

/** Deterministic PRNG (mulberry32). */
export function randomFrom(seed) {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates against a seeded source, leaving the input untouched. */
export function shuffled(items, random) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
