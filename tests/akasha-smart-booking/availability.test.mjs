import test from "node:test"
import assert from "node:assert/strict"
import {
  getAvailabilityIndicator,
  isAvailabilityConditional,
  isAvailabilityShortage,
} from "../../lib/akasha-smart-booking/availability.ts"

test("ready states disclose a current projection, not a guarantee", () => {
  assert.deepEqual(getAvailabilityIndicator("ready_now"), {
    label: "Unit tersedia untuk disewa",
    tone: "success",
  })
  assert.deepEqual(getAvailabilityIndicator("all_components_ready_now"), {
    label: "Semua barang dalam paket tersedia",
    tone: "success",
  })
})

test("available stock labels use clear customer-friendly inventory language", () => {
  assert.deepEqual(getAvailabilityIndicator("available_now"), {
    label: "Stok barang tersedia",
    tone: "success",
  })
  assert.deepEqual(getAvailabilityIndicator("other_variants_available"), {
    label: "Varian lain tersedia",
    tone: "warning",
  })
})

test("potential returns and other variants are shown as conditional", () => {
  assert.equal(isAvailabilityConditional("potential_return_may_help"), true)
  assert.equal(isAvailabilityConditional("potential_returns_may_help"), true)
  assert.equal(isAvailabilityConditional("other_variants_available"), true)
})

test("shortage and removed catalog targets produce warnings", () => {
  assert.equal(isAvailabilityShortage("shortage"), true)
  assert.equal(isAvailabilityShortage("insufficient_quantity"), true)
  assert.equal(isAvailabilityShortage("catalog_unavailable"), true)
})

test("unknown statuses remain neutral and never imply stock readiness", () => {
  assert.deepEqual(getAvailabilityIndicator("unrecognized_future_state"), {
    label: "Perlu diperiksa pengelola",
    tone: "neutral",
  })
})
