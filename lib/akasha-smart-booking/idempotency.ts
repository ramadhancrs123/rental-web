/**
 * Persisted idempotency keys survive reloads after uncertain network outcomes.
 * Never compare them with the current form payload in the browser: the database
 * is the authority that decides whether the same key is unused or already
 * committed for another payload.
 */
export function getPendingBookingIdempotencyKey(raw: string | null): string | null {
  if (!raw) return null

  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== "object" || Array.isArray(value)) return null

    const key = (value as { key?: unknown }).key
    return typeof key === "string" && key.trim().length >= 8 && key.length <= 80
      ? key.trim()
      : null
  } catch {
    return null
  }
}

/**
 * Keep keys for outcomes that may be retried safely with the same idempotency
 * key. A conflict is deliberately retained to prevent accidental duplicates.
 */
export function shouldRetainPendingBookingKey(status: number): boolean {
  return status === 409 || status === 429 || status >= 500
}
