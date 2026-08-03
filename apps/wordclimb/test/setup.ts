import "@testing-library/jest-dom/vitest"
import { afterEach, beforeEach, vi } from "vitest"

// lib/api.ts freezes API_BASE_URL at import time. Point it at a black hole so a
// test that forgets to stub fetch fails loudly instead of hitting production.
process.env.NEXT_PUBLIC_API_BASE_URL = "http://api.invalid"

beforeEach(() => {
  // jsdom 30 does not provide localStorage on Node 25+, which otherwise makes
  // every test fail with an opaque "Cannot read properties of undefined".
  if (typeof window.localStorage === "undefined") {
    throw new Error(
      `jsdom did not provide localStorage on Node ${process.version}. ` +
        "Use the Node version in .nvmrc (nvm use)."
    )
  }
  window.localStorage.clear()
  window.sessionStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
