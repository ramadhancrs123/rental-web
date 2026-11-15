import { unstable_cache } from "next/cache"
import type { Catalog } from "@/lib/catalog"
import { getSupabase, USAHA_SLUG } from "@/lib/supabase"

export type HomeMarketingConfig = {
  toleranceHours: number | null
  loyaltyProgramEnabled: boolean
  checkoutManualDiscountEnabled: boolean
}

export type FeaturedOffer = {
  name: string
  category: string
  imageUrl: string | null
}

type PublicHomeMarketingRow = {
  tolerance_hours: string | number | null
  loyalty_program_enabled: boolean
  checkout_manual_discount_enabled: boolean
}

const EMPTY_HOME_MARKETING: HomeMarketingConfig = {
  toleranceHours: null,
  loyaltyProgramEnabled: false,
  checkoutManualDiscountEnabled: false,
}

async function loadHomeMarketing(): Promise<HomeMarketingConfig> {
  const { data, error } = await getSupabase()
    .from("v_public_home_marketing")
    .select(
      "tolerance_hours,loyalty_program_enabled,checkout_manual_discount_enabled"
    )
    .eq("usaha_slug", USAHA_SLUG)
    .maybeSingle()

  if (error) throw error
  if (!data) return EMPTY_HOME_MARKETING

  const row = data as PublicHomeMarketingRow
  const toleranceHours =
    row.tolerance_hours == null ? null : Number(row.tolerance_hours)

  return {
    toleranceHours:
      toleranceHours !== null &&
      Number.isFinite(toleranceHours) &&
      toleranceHours > 0
        ? toleranceHours
        : null,
    loyaltyProgramEnabled: row.loyalty_program_enabled === true,
    checkoutManualDiscountEnabled:
      row.checkout_manual_discount_enabled === true,
  }
}

const getCachedHomeMarketing = unstable_cache(
  loadHomeMarketing,
  ["public-home-marketing-v1", USAHA_SLUG],
  {
    revalidate: 60,
    tags: ["public-home-marketing", "public-home-marketing:" + USAHA_SLUG],
  }
)

export async function fetchHomeMarketing(): Promise<HomeMarketingConfig> {
  return getCachedHomeMarketing()
}

export function formatToleranceHours(value: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(
    value
  )
}

/**
 * Selects an active catalog offer using the catalog's effective-price projection.
 * Only customer-facing identity and media leave this helper; discount values stay server-side.
 */
export function findFeaturedOffer(catalog: Catalog): FeaturedOffer | null {
  const candidates: Array<FeaturedOffer & { score: number }> = []

  for (const item of catalog.items) {
    for (const variant of item.variants) {
      if (variant.discountPercent <= 0 || variant.price >= variant.normalPrice)
        continue

      candidates.push({
        name:
          variant.nama && variant.nama !== item.nama
            ? item.nama + " · " + variant.nama
            : item.nama,
        category: item.kategori_nama,
        imageUrl: variant.imageUrl ?? item.imageUrl,
        score: variant.discountPercent,
      })
    }

    const directOption = item.directRentalOption
    if (
      directOption &&
      directOption.discountPercent > 0 &&
      directOption.price < directOption.normalPrice
    ) {
      candidates.push({
        name: item.nama,
        category: item.kategori_nama,
        imageUrl: item.imageUrl,
        score: directOption.discountPercent,
      })
    }
  }

  for (const item of catalog.packages) {
    if (
      item.discountPercent <= 0 ||
      item.price === null ||
      item.normalPrice === null ||
      item.price >= item.normalPrice
    ) {
      continue
    }

    candidates.push({
      name: item.nama,
      category: "Paket camping",
      imageUrl: item.imageUrl,
      score: item.discountPercent,
    })
  }

  for (const item of catalog.sales) {
    if (item.discountPercent <= 0 || item.price >= item.normalPrice) continue

    candidates.push({
      name: item.varian_nama
        ? item.barang_nama + " · " + item.varian_nama
        : item.barang_nama,
      category: item.kategori_nama,
      imageUrl: item.imageUrl ?? null,
      score: item.discountPercent,
    })
  }

  candidates.sort(
    (left, right) =>
      right.score - left.score || left.name.localeCompare(right.name, "id")
  )
  const featured = candidates[0]

  return featured
    ? {
        name: featured.name,
        category: featured.category,
        imageUrl: featured.imageUrl,
      }
    : null
}
