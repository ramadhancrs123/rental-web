import test from "node:test"
import assert from "node:assert/strict"
import {
  calculateRentalEstimate,
  calculateTariffPeriodsForDates,
  formatRentalStayLabel,
  getMinimumSchedulePickupDate,
  isValidSchedulePickupDate,
  formatTariffStayLabel,
  getCalendarNightCount,
} from "../../lib/rental-estimate.ts"

test("one night displays as 2 hari 1 malam", () => {
  assert.equal(getCalendarNightCount("2026-11-11", "2026-11-12"), 1)
  assert.equal(formatRentalStayLabel("2026-11-11", "2026-11-12"), "2 hari 1 malam")
  assert.equal(formatTariffStayLabel(1, "hari"), "2 hari 1 malam")
})

test("stay labels and daily billing periods grow with the selected date range", () => {
  assert.equal(formatRentalStayLabel("2026-11-11", "2026-11-13"), "3 hari 2 malam")
  assert.equal(calculateTariffPeriodsForDates("2026-11-11", "2026-11-13", 1, "hari"), 2)
  assert.equal(calculateTariffPeriodsForDates("2026-11-11", "2026-11-14", 1, "hari"), 3)
})

test("tariff periods use the Admin Walk-in ceil rule for longer tariff units", () => {
  assert.equal(calculateTariffPeriodsForDates("2026-11-11", "2026-11-13", 2, "hari"), 1)
  assert.equal(calculateTariffPeriodsForDates("2026-11-11", "2026-11-19", 1, "minggu"), 2)
  assert.equal(calculateTariffPeriodsForDates("2026-11-11", "2026-11-12", 12, "jam"), 2)
})

test("same-day rental retains the minimum one tariff period", () => {
  assert.equal(formatRentalStayLabel("2026-11-11", "2026-11-11"), "1 hari")
  assert.equal(calculateTariffPeriodsForDates("2026-11-11", "2026-11-11", 1, "hari"), 1)
})

test("a historical pickup date can remain unchanged when extending the return date", () => {
  const existingPickup = "2026-11-11"
  const today = "2026-11-12"

  assert.equal(getMinimumSchedulePickupDate(existingPickup, today), existingPickup)
  assert.equal(isValidSchedulePickupDate(existingPickup, existingPickup, today), true)
  assert.equal(isValidSchedulePickupDate("2026-11-10", existingPickup, today), false)
  assert.equal(isValidSchedulePickupDate("2026-11-13", existingPickup, today), true)
  assert.equal(isValidSchedulePickupDate("2026-02-30", existingPickup, today), false)
})

test("a new pickup date cannot be moved into the past", () => {
  const today = "2026-11-12"
  assert.equal(getMinimumSchedulePickupDate("2026-11-14", today), today)
  assert.equal(isValidSchedulePickupDate("2026-11-11", "2026-11-14", today), false)
})

test("extending only the return date from 11–12 to 11–14 calculates the added rental cost", () => {
  const currentPeriods = calculateTariffPeriodsForDates("2026-11-11", "2026-11-12", 1, "hari")
  const extendedPeriods = calculateTariffPeriodsForDates("2026-11-11", "2026-11-14", 1, "hari")

  assert.equal(currentPeriods, 1)
  assert.equal(extendedPeriods, 3)
  assert.equal(
    calculateRentalEstimate(2, 25000, extendedPeriods ?? 1) - calculateRentalEstimate(2, 25000, currentPeriods ?? 1),
    100000,
  )
})

test("invalid or unsupported date/tariff inputs do not invent a billing period", () => {
  assert.equal(getCalendarNightCount("2026-02-30", "2026-03-01"), null)
  assert.equal(calculateTariffPeriodsForDates("2026-11-12", "2026-11-11", 1, "hari"), null)
  assert.equal(calculateTariffPeriodsForDates("2026-11-11", "2026-11-12", 1, "bulan"), null)
})

test("mixed sale and two-period rental lines total Rp95,000 independently of stale one-period snapshots", () => {
  const detailTotal =
    calculateRentalEstimate(1, 15000, 1)
    + calculateRentalEstimate(1, 15000, 2)
    + calculateRentalEstimate(1, 25000, 2)

  assert.equal(detailTotal, 95000)
  assert.equal(15000 + 15000 + 25000, 55000)
  assert.notEqual(detailTotal, 55000)
})

test("rental estimate multiplies quantity, unit price, and tariff periods", () => {
  assert.equal(calculateRentalEstimate(2, 25000, 3), 150000)
  assert.equal(calculateRentalEstimate(1, 15000, 1), 15000)
})
