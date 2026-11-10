const DAY_MS = 24 * 60 * 60 * 1000

function parseDateOnly(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const timestamp = Date.UTC(year, month - 1, day)
  const parsed = new Date(timestamp)

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) return null

  return timestamp
}

/** Calendar nights between date-only pickup and return dates. */
export function getCalendarNightCount(pickupDate: string | null, returnDate: string | null): number | null {
  if (!pickupDate || !returnDate) return null
  const pickup = parseDateOnly(pickupDate)
  const returned = parseDateOnly(returnDate)
  if (pickup === null || returned === null || returned < pickup) return null
  return Math.round((returned - pickup) / DAY_MS)
}

/** User-facing stay label: one night is presented as "2 hari 1 malam". */
export function formatRentalStayLabel(pickupDate: string, returnDate: string): string | null {
  const nights = getCalendarNightCount(pickupDate, returnDate)
  if (nights === null) return null
  return nights === 0 ? "1 hari" : (nights + 1) + " hari " + nights + " malam"
}

/** Marketing label for a single catalog tariff period. */
export function formatTariffStayLabel(durationValue: number | null, durationUnit: string | null): string | null {
  if (!durationValue || durationValue <= 0 || !durationUnit?.trim()) return null
  const unit = durationUnit.trim().toLocaleLowerCase("id-ID")
  if (unit === "hari" || unit === "day" || unit === "days") {
    return (durationValue + 1) + " hari " + durationValue + " malam"
  }
  if (unit === "minggu" || unit === "week" || unit === "weeks") {
    const nights = durationValue * 7
    return (nights + 1) + " hari " + nights + " malam"
  }
  if (unit === "jam" || unit === "hour" || unit === "hours") {
    return durationValue + " jam"
  }
  return durationValue + " " + durationUnit.trim()
}

/**
 * Mirrors Admin Walk-in's ceil(elapsed / tariff-period) rule for a date-only
 * customer schedule. Because the public form asks for dates rather than times,
 * the estimate assumes pickup and return happen at the same local clock time.
 */
export function calculateTariffPeriodsForDates(
  pickupDate: string | null,
  returnDate: string | null,
  durationValue: number | null,
  durationUnit: string | null,
): number | null {
  const nights = getCalendarNightCount(pickupDate, returnDate)
  if (nights === null || !durationValue || durationValue <= 0 || !durationUnit?.trim()) return null

  const unit = durationUnit.trim().toLocaleLowerCase("id-ID")
  let tariffPeriodDays: number
  if (unit === "jam" || unit === "hour" || unit === "hours") {
    tariffPeriodDays = durationValue / 24
  } else if (unit === "hari" || unit === "day" || unit === "days") {
    tariffPeriodDays = durationValue
  } else if (unit === "minggu" || unit === "week" || unit === "weeks") {
    tariffPeriodDays = durationValue * 7
  } else {
    return null
  }

  if (!Number.isFinite(tariffPeriodDays) || tariffPeriodDays <= 0) return null
  return Math.max(1, Math.ceil(nights / tariffPeriodDays))
}

export function calculateRentalEstimate(
  quantity: number,
  unitPrice: number,
  periods: number,
): number {
  if (
    !Number.isFinite(quantity) || quantity < 0 ||
    !Number.isFinite(unitPrice) || unitPrice < 0 ||
    !Number.isFinite(periods) || periods < 1
  ) return 0
  return Math.round(quantity * unitPrice * periods * 100) / 100
}
