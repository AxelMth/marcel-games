"use client"

import { useEffect, useState, useCallback } from "react"

const STORAGE_KEY = "device-uuid"

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * A store that outlives the app itself — on iOS, the keychain.
 *
 * The mechanism is supplied by the app rather than picked here: only apps that
 * actually ship a secure-storage plugin can provide one, and this package is
 * shared with apps that do not.
 */
export interface DurableIdStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
}

/** The pre-keychain behaviour, kept as the source of a first-run identity. */
async function deriveUUID(): Promise<string> {
  try {
    const { Capacitor } = await import("@capacitor/core").catch(() => ({ Capacitor: null }))
    const { Device } = await import("@capacitor/device").catch(() => ({ Device: null }))
    if (Capacitor?.isNativePlatform() && Device) {
      const { identifier } = await Device.getId()
      return identifier
    }
  } catch {
    // fall through to web path
  }

  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = generateUUID()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}

/**
 * Returns a stable device UUID used to identify anonymous players against the
 * backend `/launch` endpoint.
 *
 * Pass a `durableStore` — on iOS, one backed by the keychain — to make that
 * identity survive uninstalling the app. Without one, `Device.getId()` returns
 * `identifierForVendor`, which iOS resets once the last app from the vendor is
 * removed: a reinstall then looks like a brand-new player and orphans their
 * history. Android is unaffected either way, since `Device.getId()` there is
 * `ANDROID_ID`, already stable across reinstalls.
 *
 * On first run with a store, the id already in use is promoted into it rather
 * than replaced, so players mid-progression keep what they have.
 */
export function useDeviceUUID(durableStore?: DurableIdStore) {
  const [uuid, setUuid] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const resolve = async () => {
      const durable = await durableStore?.get(STORAGE_KEY).catch(() => null)
      if (durable) {
        setUuid(durable)
        return
      }

      const derived = await deriveUUID()
      setUuid(derived)
      // Losing durability is a degraded experience, not a broken app: the
      // caller still has a usable id for this install.
      void durableStore?.set(STORAGE_KEY, derived).catch(() => {})
    }

    resolve()
  }, [durableStore])

  const getUUID = useCallback((): string => {
    if (uuid) return uuid
    if (typeof window === "undefined") return generateUUID()
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = generateUUID()
      localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  }, [uuid])

  return { uuid, getUUID }
}
