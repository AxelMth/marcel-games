export const colors = {
  ground: "#D9F2E3",
  halo: "#E9F9EF",
  tray: "#C3E7D1",
  rail: "#B7DFC8",
  ink: "#0B3554",
  inkLip: "#051F33",
  muted: "#3F6078",
  surface: "#FFFFFF",
  surfaceLip: "#A9D3BA",
  keyLip: "#9CC9AE",
  found: "#1F9D63",
  foundLip: "#14724A",
  primary: "#147D4C",
  primaryLip: "#0D5A36",
  accent: "#FFC53D",
  accentLip: "#D99A1B",
  star: "#E0A100",
  danger: "#E5484D",
  hiddenFill: "rgba(255, 255, 255, 0.45)",
  hiddenBorder: "#7FB597",
} as const

export const fonts = {
  display: "Fredoka_600SemiBold",
  displayBold: "Fredoka_700Bold",
  body: "Nunito_700Bold",
  bodyBold: "Nunito_800ExtraBold",
} as const

/** Height of the darker band under a tile, key or button — what makes it look pressable. */
export const LIP = 4

/** Smallest control a thumb can hit reliably (Apple HIG: 44 pt). */
export const MIN_TOUCH = 44
