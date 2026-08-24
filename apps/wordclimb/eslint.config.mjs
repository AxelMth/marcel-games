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
      // Xcode archives and exported .ipa land here; they carry a copy of the
      // Capacitor bridge, which is not ours to lint.
      "**/build/**",
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
]
