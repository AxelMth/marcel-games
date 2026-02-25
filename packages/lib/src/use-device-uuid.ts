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
 * Returns a stable device UUID persisted in localStorage.
 * Used by both earthunt and wordclimb to identify anonymous users
 * when calling the backend `/launch` endpoint.
 */
export function useDeviceUUID() {
  const [uuid, setUuid] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = generateUUID()
      localStorage.setItem(STORAGE_KEY, id)
    }
    setUuid(id)
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
