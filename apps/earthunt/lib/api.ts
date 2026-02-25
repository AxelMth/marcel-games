/**
 * Earthunt API client.
 *
 * Points at the Fly.io deployment for earthunt:
 *   https://earthunt.server.com  (production)
 *   http://localhost:8080         (local dev)
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://earthunt.server.com";

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Locations ────────────────────────────────────────────────────────────────

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  difficulty: "easy" | "medium" | "hard";
  solvedBy: number;
}

export const getLocations = () => request<Location[]>("/api/locations");

export const getLocation = (id: string) =>
  request<Location>(`/api/locations/${id}`);

// ── Scores ───────────────────────────────────────────────────────────────────

export interface ScoreEntry {
  rank: number;
  username: string;
  score: number;
  country: string;
}

export const getLeaderboard = () =>
  request<ScoreEntry[]>("/api/leaderboard");

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthPayload {
  token: string;
  username: string;
}

export const signIn = (username: string, password: string) =>
  request<AuthPayload>("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const signUp = (username: string, password: string) =>
  request<AuthPayload>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
