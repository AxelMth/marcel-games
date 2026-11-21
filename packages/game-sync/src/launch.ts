import { isRecord } from "./http"

/** What a game tells its server about the handset when it starts. */
export interface LaunchDevice {
  osName: string | null
  osVersion: string | null
  modelName: string | null
  brand: string | null
  manufacturer: string | null
  deviceType: "PHONE" | "TABLET" | "UNKNOWN"
  isDevice: boolean
}

export function parseLaunchedUserId(data: unknown): string {
  if (!isRecord(data) || typeof data.userId !== "string" || data.userId === "") {
    throw new Error("The launch answer carries no user id")
  }
  return data.userId
}
