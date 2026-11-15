import type { Catalog, CatalogSaleOption } from "@/lib/catalog"

export type SmartBookingCatalogOption = {
  key: string
  kind: "rental" | "sale"
  target_kind: "product" | "variant" | "package"
  barang_id: string | null
  varian_barang_id: string | null
  paket_sewa_id: string | null
  barang_nama: string
  varian_nama: string | null
  kategori_nama: string
  price: number
  normalPrice: number
  discountPercent: number
  priceDurationValue: number | null
  priceDurationUnit: string | null
  currency_code: string
  inventory_mode: "serialized" | "quantity" | null
  deskripsi: string | null
  imageUrl: string | null
}

function rentalItemOptions(catalog: Catalog): SmartBookingCatalogOption[] {
  const items = catalog.items.flatMap((item) => {
    const direct: SmartBookingCatalogOption[] = item.directRentalOption
      ? [{
          ...item.directRentalOption,
          kind: "rental",
          target_kind: "product",
          deskripsi: item.deskripsi,
          imageUrl: item.imageUrl,
        }]
      : []

    const variants: SmartBookingCatalogOption[] = item.variants.map((variant) => ({
      key: "variant:" + variant.varian_barang_id,
      kind: "rental",
      target_kind: "variant",
      barang_id: variant.barang_id,
      varian_barang_id: variant.varian_barang_id,
      paket_sewa_id: null,
      barang_nama: variant.barang_nama,
      varian_nama: variant.nama,
      kategori_nama: variant.kategori_nama,
      price: variant.price,
      normalPrice: variant.normalPrice,
      discountPercent: variant.discountPercent,
      priceDurationValue: variant.priceDurationValue,
      priceDurationUnit: variant.priceDurationUnit,
      currency_code: variant.currency_code,
      inventory_mode: variant.inventory_mode,
      deskripsi: variant.deskripsi ?? item.deskripsi,
      imageUrl: variant.imageUrl ?? item.imageUrl,
    }))

    return [...direct, ...variants]
  })

  const packages: SmartBookingCatalogOption[] = catalog.packages
    .filter((item) => item.canBook && item.price !== null)
    .map((item) => ({
      key: "package:" + item.paket_sewa_id,
      kind: "rental",
      target_kind: "package",
      barang_id: null,
      varian_barang_id: null,
      paket_sewa_id: item.paket_sewa_id,
      barang_nama: item.nama,
      varian_nama: null,
      kategori_nama: "Paket sewa",
      price: item.price ?? 0,
      normalPrice: item.normalPrice ?? item.price ?? 0,
      discountPercent: item.discountPercent,
      priceDurationValue: item.priceDurationValue,
      priceDurationUnit: item.priceDurationUnit,
      currency_code: item.currency_code,
      inventory_mode: null,
      deskripsi: item.deskripsi,
      imageUrl: item.imageUrl,
    }))

  return [...items, ...packages]
}

function saleItemOptions(items: CatalogSaleOption[]): SmartBookingCatalogOption[] {
  return items.map((item) => ({
    key: item.key,
    kind: "sale",
    target_kind: item.varian_barang_id ? "variant" : "product",
    barang_id: item.barang_id,
    varian_barang_id: item.varian_barang_id,
    paket_sewa_id: null,
    barang_nama: item.barang_nama,
    varian_nama: item.varian_nama,
    kategori_nama: item.kategori_nama,
    price: item.price,
    normalPrice: item.normalPrice,
    discountPercent: item.discountPercent,
    priceDurationValue: null,
    priceDurationUnit: null,
    currency_code: item.currency_code,
    inventory_mode: item.inventory_mode,
    deskripsi: item.deskripsi,
    imageUrl: item.imageUrl ?? null,
  }))
}

export function getSmartBookingCatalogOptions(catalog: Catalog): SmartBookingCatalogOption[] {
  return [...rentalItemOptions(catalog), ...saleItemOptions(catalog.sales)]
}

export function toSmartBookingLine(option: SmartBookingCatalogOption, quantity: number) {
  if (option.kind === "sale") {
    return {
      ...(option.varian_barang_id
        ? { varian_barang_id: option.varian_barang_id }
        : { barang_id: option.barang_id }),
      jumlah: quantity,
    }
  }

  return {
    ...(option.target_kind === "product" ? { barang_id: option.barang_id } : {}),
    ...(option.target_kind === "variant" ? { varian_barang_id: option.varian_barang_id } : {}),
    ...(option.target_kind === "package" ? { paket_sewa_id: option.paket_sewa_id } : {}),
    jumlah: quantity,
  }
}

export function smartBookingOptionLabel(option: SmartBookingCatalogOption): string {
  const target = option.varian_nama
    ? option.barang_nama + " · " + option.varian_nama
    : option.barang_nama
  return (option.kind === "rental" ? "Sewa · " : "Beli · ") + target
}

export function hasSmartBookingQuantityChanges(
  original: Record<string, number>,
  draft: Record<string, number>,
): boolean {
  const keys = new Set([...Object.keys(original), ...Object.keys(draft)])
  return [...keys].some((key) => (original[key] ?? 0) !== (draft[key] ?? 0))
}
