import Svg, { Path, Polygon } from "react-native-svg"

interface IconProps {
  size?: number
  color: string
}

const STROKE = { strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const

export function ChevronLeftIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5l-7 7 7 7" stroke={color} strokeWidth={2.6} {...STROKE} />
    </Svg>
  )
}

export function BackspaceIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M9 5h11v14H9l-6-7 6-7zM13 10l4 4M17 10l-4 4"
        stroke={color}
        strokeWidth={2.2}
        {...STROKE}
      />
    </Svg>
  )
}

export function StarIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon
        points="12,2 15,8.6 22,9.4 16.8,14.2 18.3,21.2 12,17.6 5.7,21.2 7.2,14.2 2,9.4 9,8.6"
        fill={color}
      />
    </Svg>
  )
}
