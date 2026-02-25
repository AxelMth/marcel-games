"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "earthunt-device-uuid"

function generateUuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function useDeviceUuid(): string | null {
  const [uuid, setUuid] = useState<string | null>(null)

  useEffect(() => {
    try {
      let value = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
      if (!value) {
        value = generateUuid()
        localStorage.setItem(STORAGE_KEY, value)
      }
      setUuid(value)
    } catch {
      setUuid(generateUuid())
    }
  }, [])

  return uuid
}
