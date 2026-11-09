import test from "node:test"
import assert from "node:assert/strict"
import {
  createPortalAccessUrl,
  parsePortalAccessFragment,
} from "../../lib/akasha-smart-booking/portal-link.ts"

const token = "a".repeat(64)

test("parses a valid private portal link token from the URL fragment", () => {
  assert.deepEqual(parsePortalAccessFragment("#access=" + token), {
    present: true,
    token,
  })
})

test("accepts percent-encoded tokens and normalizes hexadecimal case", () => {
  assert.deepEqual(parsePortalAccessFragment("#access=" + encodeURIComponent(token.toUpperCase())), {
    present: true,
    token,
  })
})

test("distinguishes a missing fragment credential from an invalid one", () => {
  assert.deepEqual(parsePortalAccessFragment(""), { present: false, token: null })
  assert.deepEqual(parsePortalAccessFragment("#section=booking"), { present: false, token: null })
  assert.deepEqual(parsePortalAccessFragment("#access=short"), { present: true, token: null })
})

test("builds HTTPS private links with the credential in the fragment", () => {
  assert.equal(
    createPortalAccessUrl("https://akasha.example", token),
    "https://akasha.example/booking/portal#access=" + token,
  )
})

test("refuses malformed tokens and insecure non-local origins", () => {
  assert.equal(createPortalAccessUrl("https://akasha.example", "not-a-token"), null)
  assert.equal(createPortalAccessUrl("http://akasha.example", token), null)
})
