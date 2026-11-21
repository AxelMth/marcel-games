import { createWalletStore } from "@marcel-games/expo-ui"

const wallet = createWalletStore("wordclimb-coins")

export const loadWallet = wallet.load
export const payCoins = wallet.pay
export const earnCoinsForStars = wallet.earnForStars
export const useCoinBalance = wallet.useBalance
