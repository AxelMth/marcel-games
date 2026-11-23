import { openWallet, rewardForAd, rewardForStars, spendCoins, type Wallet } from "@marcel-games/game-sync"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSyncExternalStore } from "react"

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

export interface WalletStore {
  /** Reads the wallet and applies the weekly top-up. A wallet that cannot be read stays closed. */
  load: () => Promise<void>
  /** Pays for a hint. False when the wallet is not open or cannot cover the cost. */
  pay: (cost: number) => boolean
  earnForStars: (stars: number) => void
  earnForAd: () => void
  /** The coin balance, or null while the wallet has not been read. */
  useBalance: () => number | null
}

export function createWalletStore(storageKey: string): WalletStore {
  // Null until the stored wallet has been read. Spending waits for that read:
  // paying out of a fresh wallet and then saving it would overwrite the real one.
  let wallet: Wallet | null = null
  let loading: Promise<void> | null = null
  const listeners = new Set<() => void>()

  const publish = (next: Wallet): void => {
    wallet = next
    for (const listener of listeners) listener()
  }

  const save = async (next: Wallet): Promise<void> => {
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(next))
    } catch (error) {
      console.error("Could not save the coin wallet", error)
    }
  }

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  const balance = (): number | null => wallet?.balance ?? null

  return {
    load() {
      loading ??= AsyncStorage.getItem(storageKey)
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
    },
    pay(cost) {
      if (!wallet) return false
      const paid = spendCoins(wallet, cost)
      if (!paid) return false
      publish(paid)
      void save(paid)
      return true
    },
    earnForStars(stars) {
      if (!wallet) return
      const richer = rewardForStars(wallet, stars)
      publish(richer)
      void save(richer)
    },
    earnForAd() {
      if (!wallet) return
      const richer = rewardForAd(wallet)
      publish(richer)
      void save(richer)
    },
    useBalance: () => useSyncExternalStore(subscribe, balance, balance),
  }
}
