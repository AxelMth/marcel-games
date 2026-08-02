import { defineConfig, devices } from "@playwright/test"

const PORT = 4599
const BASE_URL = `http://127.0.0.1:${PORT}`

// The app runs inside WKWebView on iOS, so WebKit is the faithful engine here —
// not a convenience default.
const IPHONE = devices["iPhone 15 Pro"]

export default defineConfig({
  testDir: "./e2e",
  // Runs against the static export Capacitor actually embeds, not a dev server.
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1 --directory out`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "ignore",
    stderr: "ignore",
  },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  // The API is fully mocked, so a failure is real — retrying would only hide it.
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  projects: [
    // Both locales run the whole suite: the language comes from
    // navigator.language, and a missing translation only shows up this way.
    { name: "iphone-fr", use: { ...IPHONE, locale: "fr-FR" } },
    { name: "iphone-en", use: { ...IPHONE, locale: "en-US" } },
  ],
})
