import test from "node:test"
import assert from "node:assert/strict"
import {
  getAvailabilityIndicator,
  isAvailabilityConditional,
  isAvailabilityShortage,
} from "../../lib/akasha-smart-booking/availability.ts"

test("ready states disclose a current projection, not a guarantee", () => {
  assert.deepEqual(getAvailabilityIndicator("ready_now"), {
    label: "Terlihat siap saat diperiksa",
    tone: "success",
  })
  assert.deepEqual(getAvailabilityIndicator("all_components_ready_now"), {
    label: "Komponen terlihat siap",
    tone: "success",
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
