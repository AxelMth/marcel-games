import "@testing-library/jest-dom/vitest"
import { afterEach, beforeEach, expect, vi } from "vitest"
import { useGameStore } from "@/lib/game-store"

// lib/api.ts freezes API_BASE_URL at import time from this variable. Point it at
// a black hole so a test that forgets to stub fetch fails loudly instead of
// silently hitting the production Fly.io API.
process.env.NEXT_PUBLIC_API_BASE_URL = "http://api.invalid"

// The zustand store is a module singleton with no reset(). Snapshot it once at
// load — the snapshot carries the actions too, so replacing wholesale restores
// a pristine store without touching production code.
const PRISTINE_STORE_STATE = useGameStore.getState()

beforeEach(() => {
  // jsdom 30 does not provide localStorage on Node 25+, which otherwise makes
  // every single test fail with an opaque "Cannot read properties of
  // undefined". See .nvmrc — the project runs on Node 22.
  if (typeof window.localStorage === "undefined") {
    throw new Error(
      `jsdom did not provide localStorage on Node ${process.version}. ` +
        "Use the Node version in .nvmrc (nvm use)."
    )
  }
  window.localStorage.clear()
  window.sessionStorage.clear()
  useGameStore.setState(PRISTINE_STORE_STATE, true)

  // Any un-stubbed network call is a bug in the test, not a reason to reach out.
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      throw new Error(
        `Un-stubbed fetch to ${String(input)} — stub it with vi.mocked(fetch) in the test.`
      )
    })
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

/** Shorthand for the one-shot JSON responses most API stubs need. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

expect.extend({})
