# Capacitor app icon source images

`@capacitor/assets` reads this folder to generate the native icons. Run it after
changing anything here:

```bash
pnpm --filter @marcel-games/wordclimb assets
npx cap sync
```

## The three files, and why there are three

- **icon-only.png** — 1024×1024, opaque. What iOS ships. iOS icons cannot be
  transparent: a logo on an alpha background gets composited onto whatever the
  system feels like, so the green is baked in here.
- **icon-background.png** — 1024×1024, flat green. Android adaptive icons keep
  background and foreground on separate layers so the launcher can parallax and
  mask them independently.
- **icon-foreground.png** — 1024×1024, transparent. Android crops the foreground
  to a safe zone well inside the canvas, which is why the drawing occupies only
  ~43 % of the width here against ~84 % in `icon-only.png`. Filling the canvas
  would get the logo's edges shaved off on round-mask launchers.

## The green

`#7ED7A5`, the 40 % stop of the home screen gradient — the same colour the
native launch screen uses. Earthunt applies exactly this rule with `#69CBEB`,
its own 40 % stop, so the two apps sit side by side on a springboard with the
same composition and each its own hue.

## Regenerating from the raw logo

The source drawing is not square (it was 944×898 with transparent margins), so
it is cropped to its alpha bounding box and re-centred rather than scaled as-is
— otherwise the stack sits off-centre. Pillow does the compositing; it is not a
project dependency, install it in a throwaway virtualenv if you need to redo
this.
