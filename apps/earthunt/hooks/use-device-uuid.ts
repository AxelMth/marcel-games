"use client"

import { useDeviceUUID, type DurableIdStore } from "@marcel-games/lib"

/**
 * Keychain-backed identity store.
 *
 * The keychain is the only iOS store that outlives deleting the app, which is
 * what keeps a reinstalling player attached to the history the server already
 * holds for them. On the web the plugin falls back to localStorage, so the
 * hook behaves exactly as it did before.
 *
 * Defined once at module scope: a new object on every render would re-run the
 * hook's effect forever.
 */
const keychainStore: DurableIdStore = {
  async get(key) {
    const { SecureStorage } = await import("@aparajita/capacitor-secure-storage")
    return SecureStorage.getItem(key)
  },
  async set(key, value) {
    const { SecureStorage } = await import("@aparajita/capacitor-secure-storage")
    await SecureStorage.setItem(key, value)
  },
}

/**
 * Backwards-compatible wrapper around shared device UUID hook.
 */
export function useDeviceUuid(): string | null {
  const { uuid } = useDeviceUUID(keychainStore)
  return uuid
}
