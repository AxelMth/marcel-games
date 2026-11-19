import { Linking } from "react-native"

// Published from legal/ by the legal-pages workflow; the same URL goes into App Store Connect.
const LEGAL_URL = "https://axelmth.github.io/marcel-games/wordclimb-privacy-and-terms"

export async function openLegalPage(): Promise<void> {
  try {
    await Linking.openURL(LEGAL_URL)
  } catch (error) {
    console.error("Could not open the privacy page", error)
  }
}
