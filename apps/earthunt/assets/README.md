# Capacitor app icon and splash source images

Place source images here for `@capacitor/assets` to generate native icons and splash screens.

## Required files

- **icon-only.png** — App icon, minimum 1024×1024 px (use earth-logo)
- **splash.png** — Splash screen, minimum 2732×2732 px (use earth-logo or a centered version)

## Setup

1. Add or copy the images (e.g. from the earthunt repo `assets/earth-logo.png`). Resize as needed to meet the minimum dimensions.
2. Run:

   ```bash
   pnpm install
   npx capacitor-assets generate
   ```

3. Rebuild/sync native projects: `pnpm run mobile`

See [Capacitor splash screens and icons](https://capacitorjs.com/docs/guides/splash-screens-and-icons).
