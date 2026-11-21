/**
 * Countries ordered from the most to the least recognisable.
 *
 * Levels draw from a window at the head of this list that widens as the player
 * progresses, which is what makes early levels approachable. Ranking on area
 * alone — as the server used to — puts Kazakhstan and Greenland ahead of Japan
 * and Germany, so this averages the area rank with the population rank: size
 * and fame together describe "would a player have heard of it" far better than
 * either on its own.
 *
 * Antarctica is deliberately absent. It sits second by area, so it surfaced in
 * the very first levels of a game that asks the player to name countries.
 *
 * Generated from server/earthunt/internal/constants/countries.go.
 */
export const COUNTRY_DIFFICULTY_ORDER: readonly string[] = [
  "CHN", "USA", "IND", "BRA", "RUS", "IDN", "MEX", "COD",
  "IRN", "CAN", "ARG", "NGA", "ETH", "PAK", "DZA", "EGY",
  "SDN", "ZAF", "COL", "TUR", "PER", "AUS", "SAU", "TZA",
  "MMR", "FRA", "THA", "JPN", "KAZ", "UKR", "DEU", "VEN",
  "ESP", "KEN", "VNM", "AFG", "PHL", "NER", "MOZ", "MLI",
  "AGO", "ITA", "MAR", "CHL", "YEM", "IRQ", "BGD", "GBR",
  "TCD", "UZB", "MDG", "POL", "MYS", "ZMB", "CMR", "BOL",
  "LBY", "UGA", "SOM", "CIV", "GHA", "ROU", "ZWE", "KOR",
  "BFA", "NPL", "ECU", "SYR", "SWE", "PRK", "MNG", "KHM",
  "GIN", "SEN", "MRT", "PNG", "CAF", "PRY", "MWI", "TKM",
  "TUN", "GRC", "BLR", "GTM", "NAM", "LKA", "FIN", "CUB",
  "GRL", "NOR", "LAO", "PRT", "TWN", "BWA", "TJK", "BEN",
  "HUN", "NLD", "KGZ", "COG", "CZE", "HND", "NZL", "BGR",
  "NIC", "AZE", "ERI", "AUT", "SRB", "JOR", "DOM", "URY",
  "BEL", "OMN", "RWA", "GAB", "TGO", "CHE", "ARE", "BDI",
  "LBR", "SLE", "HTI", "GEO", "IRL", "GUY", "SVK", "DNK",
  "BIH", "PAN", "HRV", "CRI", "ISR", "SUR", "SLV", "LTU",
  "MDA", "LVA", "ISL", "ALB", "ARM", "EST", "GNB", "LSO",
  "BTN", "MKD", "LBN", "KWT", "PRI", "SVN", "GNQ", "JAM",
  "SLB", "SWZ", "DJI", "FJI", "GMB", "TLS", "BLZ", "MNE",
  "QAT", "CYP", "TTO", "NCL", "BHS", "VUT", "BRN", "FLK",
  "LUX",
]
