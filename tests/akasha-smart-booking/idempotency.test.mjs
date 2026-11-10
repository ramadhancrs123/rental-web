import test from "node:test"
import assert from "node:assert/strict"
import {
  getPendingBookingIdempotencyKey,
  shouldRetainPendingBookingKey,
} from "../../lib/akasha-smart-booking/idempotency.ts"

test("reuses a legacy pending key even when its saved fingerprint is stale", () => {
  const raw = JSON.stringify({
    key: "old-request-key-123",
    fingerprint: "previous-form-data",
    fingerprint_hash: "previous-hash",
  })
  assert.equal(getPendingBookingIdempotencyKey(raw), "old-request-key-123")
})

test("returns null for missing, malformed, or invalid pending state", () => {
  assert.equal(getPendingBookingIdempotencyKey(null), null)
  assert.equal(getPendingBookingIdempotencyKey("{"), null)
  assert.equal(getPendingBookingIdempotencyKey(JSON.stringify({ key: "short" })), null)
  assert.equal(getPendingBookingIdempotencyKey(JSON.stringify({ key: 42 })), null)
})

test("retains keys after ambiguous server outcomes and rate limits", () => {
  assert.equal(shouldRetainPendingBookingKey(409), true)
  assert.equal(shouldRetainPendingBookingKey(429), true)
  assert.equal(shouldRetainPendingBookingKey(500), true)
  assert.equal(shouldRetainPendingBookingKey(503), true)
})

test("clears keys after definitive client-side rejections", () => {
  assert.equal(shouldRetainPendingBookingKey(400), false)
  assert.equal(shouldRetainPendingBookingKey(401), false)
  assert.equal(shouldRetainPendingBookingKey(404), false)
})
