/**
 * WordClimb API client.
 *
 * Points at the Fly.io deployment for wordclimb:
 *   https://wordclimb.server.com  (production)
 *   http://localhost:8080          (local dev)
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://wordclimb.server.com";

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

// ── Puzzles ───────────────────────────────────────────────────────────────────

export interface Puzzle {
  id: string;
  word: string;
  hint: string;
  difficulty: "easy" | "medium" | "hard";
  solvedBy: number;
}

export const getPuzzles = () => request<Puzzle[]>("/api/puzzles");

export const getPuzzle = (id: string) =>
  request<Puzzle>(`/api/puzzles/${id}`);

export const submitAnswer = (puzzleId: string, answer: string) =>
  request<{ correct: boolean; points: number }>(`/api/puzzles/${puzzleId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });

// ── Scores ───────────────────────────────────────────────────────────────────

export interface ScoreEntry {
  rank: number;
  username: string;
  score: number;
  streak: number;
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
