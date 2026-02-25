/**
 * WordClimb Backend API.
 * Shares the same marcel-games-backend (Fly.io) with a different game mode context.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://marcel-games-backend.fly.dev"

export type LaunchResponse = {
  userId: string
}

export async function postLaunch(body: {
  deviceUUID: string
  brand?: string | null
  osName?: string | null
  osVersion?: string | null
  modelName?: string | null
  manufacturer?: string | null
  deviceType: string
  isDevice?: boolean | null
}): Promise<LaunchResponse> {
  const res = await fetch(`${API_BASE_URL}/launch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Launch failed: ${res.status}`)
  return res.json()
}
