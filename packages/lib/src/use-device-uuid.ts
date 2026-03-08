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
 * Returns a stable device UUID: on native uses Capacitor Device.getId(),
 * on web uses localStorage. Used by earthunt (and optionally wordclimb)
 * to identify anonymous users when calling the backend `/launch` endpoint.
 */
export function useDeviceUUID() {
  const [uuid, setUuid] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const resolve = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core").catch(() => ({ Capacitor: null }))
        const { Device } = await import("@capacitor/device").catch(() => ({ Device: null }))
        if (Capacitor?.isNativePlatform() && Device) {
          const { identifier } = await Device.getId()
          setUuid(identifier)
          return
        }
      } catch {
        // fall through to web path
      }

      let id = localStorage.getItem(STORAGE_KEY)
      if (!id) {
        id = generateUUID()
        localStorage.setItem(STORAGE_KEY, id)
      }
      setUuid(id)
    }

    resolve()
  }, [])

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
