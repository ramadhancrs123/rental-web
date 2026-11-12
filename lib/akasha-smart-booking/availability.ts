export type AvailabilityTone = "success" | "warning" | "danger" | "neutral"

export type AvailabilityIndicator = {
  label: string
  tone: AvailabilityTone
}

const INDICATORS: Record<string, AvailabilityIndicator> = {
  ready_now: { label: "Unit tersedia untuk disewa", tone: "success" },
  all_components_ready_now: { label: "Semua barang dalam paket tersedia", tone: "success" },
  available_now: { label: "Stok barang tersedia", tone: "success" },
  other_variants_available: { label: "Varian lain tersedia", tone: "warning" },
  potential_return: { label: "Bergantung pada pengembalian", tone: "warning" },
  potential_return_may_help: { label: "Mungkin tersedia setelah pengembalian", tone: "warning" },
  potential_returns_may_help: { label: "Mungkin tersedia setelah pengembalian", tone: "warning" },
  one_or_more_components_need_review: { label: "Sebagian komponen perlu ditinjau", tone: "warning" },
  insufficient_quantity: { label: "Jumlah belum mencukupi saat ini", tone: "danger" },
  shortage: { label: "Jumlah belum mencukupi saat ini", tone: "danger" },
  currently_unavailable: { label: "Belum tersedia saat ini", tone: "danger" },
  one_or_more_components_short: { label: "Ada komponen belum mencukupi", tone: "danger" },
  catalog_unavailable: { label: "Item tidak lagi tersedia di katalog", tone: "danger" },
  package_components_unavailable: { label: "Komponen paket belum dapat dipastikan", tone: "danger" },
}

export function getAvailabilityIndicator(status: string): AvailabilityIndicator {
  return INDICATORS[status] ?? {
    label: "Perlu diperiksa pengelola",
    tone: "neutral",
  }
}

export function isAvailabilityShortage(status: string): boolean {
  return getAvailabilityIndicator(status).tone === "danger"
}

export function isAvailabilityConditional(status: string): boolean {
  return getAvailabilityIndicator(status).tone === "warning"
}
