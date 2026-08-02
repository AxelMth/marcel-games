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
    {
      name: "iphone-fr",
      testIgnore: /screenshots\.spec\.ts/,
      use: { ...IPHONE, locale: "fr-FR" },
    },
    {
      name: "iphone-en",
      testIgnore: /screenshots\.spec\.ts/,
      use: { ...IPHONE, locale: "en-US" },
    },
    // Store screenshots. 1290x2796 is the App Store 6.9" requirement; the
    // viewport is in CSS pixels at dsf 3, so 430x932 renders at exactly that.
    // Skipped unless SCREENSHOTS=1 (see screenshots.spec.ts).
    {
      name: "screenshots-fr",
      testMatch: /screenshots\.spec\.ts/,
      use: {
        ...IPHONE,
        locale: "fr-FR",
        viewport: { width: 430, height: 932 },
        deviceScaleFactor: 3,
      },
    },
    {
      name: "screenshots-en",
      testMatch: /screenshots\.spec\.ts/,
      use: {
        ...IPHONE,
        locale: "en-US",
        viewport: { width: 430, height: 932 },
        deviceScaleFactor: 3,
      },
    },
  ],
})
