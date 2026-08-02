import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  // Resolves the "@/*" alias from tsconfig.json natively — no plugin needed.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    // e2e/ belongs to Playwright and must not be collected here.
    include: ["{lib,components,hooks,app}/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
})
