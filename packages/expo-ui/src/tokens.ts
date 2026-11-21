export const colors = {
  ground: "#F3F6F4",
  tray: "#E9EEEB",
  line: "#D5DED8",
  lineStrong: "#8A9A91",
  ink: "#14202B",
  inkSoft: "#2B3945",
  muted: "#55655C",
  surface: "#FFFFFF",
  found: "#1F7A54",
  star: "#C98A00",
  starOff: "#D5DED8",
  danger: "#C4343A",
  hidden: "#E9EEEB",
} as const

export const fonts = {
  display: "Outfit_600SemiBold",
  body: "Inter_500Medium",
  bodyBold: "Inter_600SemiBold",
} as const

/** Smallest control a thumb can hit reliably (Apple HIG: 44 pt). */
export const MIN_TOUCH = 44
