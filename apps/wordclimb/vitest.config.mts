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
    server: {
      deps: {
        // Workspace packages ship TypeScript, not a build. Left externalised
        // they are handed to Node raw, which then reads our "@/…" aliases as
        // npm package names and fails to resolve them — so any test rendering
        // a component that pulls in @marcel-games/* cannot even load.
        inline: [/@marcel-games\//],
      },
    },
  },
})
