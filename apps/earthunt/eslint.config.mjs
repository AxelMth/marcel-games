import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [
      "**/.next/**",
      "**/out/**",
      "**/ios/**",
      "**/android/**",
      "**/next-env.d.ts",
      "**/playwright-report/**",
      "**/test-results/**",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      // Catches hooks called after an early return — the exact defect that sat
      // undetected in success-screen.tsx. Never downgrade this to a warning.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    // Playwright fixtures take a callback named `use`, which the React rule
    // mistakes for a hook. There is no React in the end-to-end suite.
    files: ["e2e/**/*.ts", "playwright.config.ts"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
]
