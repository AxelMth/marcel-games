import { isCountryCodes } from "@marcel-games/earthunt-core"
import { createDailyStore } from "@marcel-games/expo-ui"

/** The puzzle is the codes of the countries to find. */
export const daily = createDailyStore<string[]>("earthunt-daily", isCountryCodes)
