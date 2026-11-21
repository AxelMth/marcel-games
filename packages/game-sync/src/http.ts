export class ApiHttpError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = "ApiHttpError"
  }
}

const REQUEST_TIMEOUT_MS = 8_000

export interface JsonRequest {
  method: "GET" | "POST"
  body?: unknown
}

/**
 * Sends a request and hands the decoded answer to `parse`, which is where the
 * caller checks its shape: nothing a server says is trusted as typed.
 */
export async function requestJson<T>(
  url: string,
  request: JsonRequest,
  parse: (data: unknown) => T
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      method: request.method,
      headers: { "Content-Type": "application/json" },
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new ApiHttpError(`${request.method} ${url} answered ${response.status}`, response.status)
    }
    return parse(await response.json())
  } finally {
    clearTimeout(timeout)
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
}
