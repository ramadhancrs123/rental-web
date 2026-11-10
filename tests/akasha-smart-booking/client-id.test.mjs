import test from "node:test"
import assert from "node:assert/strict"
import { createClientId } from "../../lib/client-id.ts"

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

test("prefers the native randomUUID implementation", () => {
  let called = false
  const value = createClientId({
    randomUUID() {
      called = true
      return "00000000-0000-4000-8000-000000000001"
    },
  })
  assert.equal(called, true)
  assert.match(value, UUID_V4)
})

test("uses getRandomValues when randomUUID is unavailable", () => {
  let called = false
  const value = createClientId({
    getRandomValues(bytes) {
      called = true
      bytes.fill(0)
      return bytes
    },
  })
  assert.equal(called, true)
  assert.match(value, UUID_V4)
})

test("falls back safely when Web Crypto is unavailable", () => {
  const value = createClientId({})
  assert.match(value, UUID_V4)
})
