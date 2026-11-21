import {
  openWallet,
  rewardForStars,
  spendCoins,
  type Wallet,
} from "@marcel-games/wordclimb-core"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSyncExternalStore } from "react"

const STORAGE_KEY = "wordclimb-coins"

// Null until the stored wallet has been read. Spending waits for that read:
// paying out of a fresh wallet and then saving it would overwrite the real one.
let wallet: Wallet | null = null
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

function publish(next: Wallet): void {
  wallet = next
  for (const listener of listeners) listener()
}

function parseWallet(stored: string | null): Wallet | null {
  if (stored === null) return null
  const data: unknown = JSON.parse(stored)
  if (
    typeof data !== "object" ||
    data === null ||
    !("balance" in data) ||
    !("week" in data) ||
    typeof data.balance !== "number" ||
    !Number.isInteger(data.balance) ||
    data.balance < 0 ||
    typeof data.week !== "string"
  ) {
    throw new Error(`Stored wallet is not a wallet: ${stored}`)
  }
  return { balance: data.balance, week: data.week }
}

async function save(next: Wallet): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch (error) {
    console.error("Could not save the coin wallet", error)
  }
}

/** Reads the wallet and applies the weekly top-up. A wallet that cannot be read stays closed. */
export function loadWallet(): Promise<void> {
  loading ??= AsyncStorage.getItem(STORAGE_KEY)
    .then((stored) => {
      const opened = openWallet(parseWallet(stored), new Date())
      publish(opened)
      return save(opened)
    })
    .catch((error: unknown) => {
      console.error("Could not read the coin wallet", error)
      loading = null
    })
  return loading
}

/** Pays for a hint. False when the wallet is not open or cannot cover the cost. */
export function payCoins(cost: number): boolean {
  if (!wallet) return false
  const paid = spendCoins(wallet, cost)
  if (!paid) return false
  publish(paid)
  void save(paid)
  return true
}

export function earnCoinsForStars(stars: number): void {
  if (!wallet) return
  const richer = rewardForStars(wallet, stars)
  publish(richer)
  void save(richer)
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getBalance(): number | null {
  return wallet?.balance ?? null
}

/** The coin balance, or null while the wallet has not been read. */
export function useCoinBalance(): number | null {
  return useSyncExternalStore(subscribe, getBalance, getBalance)
}
