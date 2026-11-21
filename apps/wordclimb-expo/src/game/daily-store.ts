import { createDailyStore } from "@marcel-games/expo-ui"
import { isLevel, type Level } from "@marcel-games/wordclimb-core"

export const daily = createDailyStore<Level>("wordclimb-daily", isLevel)
