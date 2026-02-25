"use client"

import { useDeviceUUID } from "@marcel-games/lib"

/**
 * Backwards-compatible wrapper around shared device UUID hook.
 */
export function useDeviceUuid(): string | null {
  const { uuid } = useDeviceUUID()
  return uuid
}
