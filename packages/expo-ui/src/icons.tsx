import Svg, { Circle, Path, Polygon } from "react-native-svg"

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

export function CoinIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Circle cx={10} cy={10} r={8} stroke={color} strokeWidth={2} fill="none" />
      <Circle cx={10} cy={10} r={3} fill={color} />
    </Svg>
  )
}

/** A minted coin, for rewards and balances: a gold disc with a rim and a shine. */
export function GoldCoin({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={11} fill="#B7790A" />
      <Circle cx={12} cy={11.2} r={10} fill="#F5B921" />
      <Circle cx={12} cy={11.2} r={6.6} fill="none" stroke="#D99A12" strokeWidth={1.6} />
      <Path d="M7.4 7.6a6 6 0 0 1 4.2-2.2" stroke="#FFE38A" strokeWidth={1.8} {...STROKE} />
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
