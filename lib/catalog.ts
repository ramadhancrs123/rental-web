import { unstable_cache } from "next/cache"
import { getSupabase, USAHA_SLUG } from "@/lib/supabase"

export type CatalogRentalOption = {
  key: string
  kind: "product" | "variant" | "package"
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
}

export type CatalogVariant = {
  varian_barang_id: string
  barang_id: string
  barang_nama: string
  nama: string
  kategori_nama: string
  deskripsi: string | null
  price: number
  normalPrice: number
  discountPercent: number
  priceDurationValue: number
  priceDurationUnit: string
  currency_code: string
  inventory_mode: "serialized" | "quantity" | null
}

export type CatalogItem = {
  barang_id: string
  nama: string
  slug: string
  kategori_nama: string
  deskripsi: string | null
  ringkasan_publik: string | null
  imageUrl: string | null
  variants: CatalogVariant[]
  directRentalOption: CatalogRentalOption | null
  minPrice: number | null
  minPriceDurationValue: number | null
  minPriceDurationUnit: string | null
}

export type CatalogSaleOption = {
  key: string
  barang_id: string
  varian_barang_id: string | null
  barang_nama: string
  varian_nama: string | null
  kategori_nama: string
  deskripsi: string | null
  price: number
  normalPrice: number
  discountPercent: number
  currency_code: string
  inventory_mode: "serialized" | "quantity" | null
  imageUrl?: string | null
}

export type CatalogPackage = {
  paket_sewa_id: string
  nama: string
  slug: string
  deskripsi: string | null
  imageUrl: string | null
  currency_code: string
  price: number | null
  normalPrice: number | null
  discountPercent: number
  priceDurationValue: number | null
  priceDurationUnit: string | null
  priceSource: "tarif" | "harga_dasar" | null
  canBook: boolean
}

export type Catalog = {
  usahaNama: string | null
  items: CatalogItem[]
  packages: CatalogPackage[]
  sales: CatalogSaleOption[]
}

type PublicBarang = {
  barang_id: string
  usaha_nama?: string
  nama: string
  slug: string
  kategori_nama: string
  deskripsi: string | null
  ringkasan_publik: string | null
}

type PublicRentalRow = {
  barang_id: string
  barang_nama: string
  barang_slug: string
  barang_deskripsi: string | null
  ringkasan_publik: string | null
  kategori_nama: string
  varian_barang_id: string | null
  varian_nama: string | null
  varian_deskripsi: string | null
  tarif_sewa_id: string
  tarif_nama: string
  durasi_unit: string
  durasi_nilai: number
  harga_normal: string | number
  diskon_persen: string | number
  harga_efektif: string | number
  currency_code: string
  inventory_mode: "serialized" | "quantity" | null
}

type PublicSaleRow = {
  barang_id: string
  barang_nama: string
  varian_barang_id: string | null
  varian_nama: string | null
  kategori_nama: string
  barang_deskripsi: string | null
  varian_deskripsi: string | null
  harga_normal: string | number
  diskon_persen: string | number
  harga_efektif: string | number
  currency_code: string
  inventory_mode: "serialized" | "quantity" | null
}

type PublicTariff = {
  tarif_sewa_id: string
  paket_sewa_id: string | null
  nominal: string | number
  durasi_unit: string
  durasi_nilai: number
  currency_code: string
}

type PublicPackage = {
  paket_sewa_id: string
  usaha_slug: string
  usaha_nama: string
  nama: string
  slug: string
  deskripsi: string | null
  harga_dasar: string | number | null
  currency_code: string
}

type PublicPackagePromo = {
  paket_sewa_id: string
  tarif_sewa_id: string
  harga_normal: string | number
  harga_promo: string | number
  currency_code: string
}

type PublicMedia = {
  barang_id?: string
  paket_sewa_id?: string
  storage_bucket: string
  storage_path: string
  media_type: string
  urutan: number
  is_cover: boolean
  status?: string
}

const PUBLIC_MEDIA_BUCKET = "rental-public-media"
const PUBLIC_CATALOG_REVALIDATE_SECONDS = 60
const PUBLIC_CATALOG_TAG = "public-catalog"

function getPublicMediaUrl(media: PublicMedia | undefined): string | null {
  if (!media || media.storage_bucket !== PUBLIC_MEDIA_BUCKET) return null
  return getSupabase().storage.from(PUBLIC_MEDIA_BUCKET).getPublicUrl(media.storage_path).data.publicUrl
}

/**
 * The booking writer resolves the tariff by duration value, then nominal.
 * Keep the public default-rate choice aligned with that server selection.
 */
function pickBestTariff<T extends { durasi_nilai: number; nominal?: string | number; harga_normal?: string | number }>(
  rows: T[],
): T | null {
  if (!rows.length) return null
  return [...rows].sort((a, b) => {
    if (a.durasi_nilai !== b.durasi_nilai) return a.durasi_nilai - b.durasi_nilai
    const aPrice = Number(a.nominal ?? a.harga_normal ?? 0)
    const bPrice = Number(b.nominal ?? b.harga_normal ?? 0)
    if (aPrice !== bPrice) return aPrice - bPrice
    return 0
  })[0]
}

export function formatRentalDuration(value: number | null, unit: string | null) {
  return value && unit ? String(value) + " " + unit : null
}

function toNumber(value: string | number | null | undefined, fallback = 0): number {
  if (value == null) return fallback
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function buildRentalOption(row: PublicRentalRow): CatalogRentalOption {
  return {
    key: row.varian_barang_id
      ? "variant:" + row.varian_barang_id
      : "product:" + row.barang_id,
    kind: row.varian_barang_id ? "variant" : "product",
    barang_id: row.varian_barang_id ? null : row.barang_id,
    varian_barang_id: row.varian_barang_id,
    paket_sewa_id: null,
    barang_nama: row.barang_nama,
    varian_nama: row.varian_nama,
    kategori_nama: row.kategori_nama,
    price: toNumber(row.harga_efektif),
    normalPrice: toNumber(row.harga_normal),
    discountPercent: toNumber(row.diskon_persen),
    priceDurationValue: row.durasi_nilai,
    priceDurationUnit: row.durasi_unit,
    currency_code: row.currency_code?.trim() || "IDR",
    inventory_mode: row.inventory_mode ?? "serialized",
  }
}

type CatalogBase = {
  usahaNama: string | null
  items: CatalogItem[]
  sales: CatalogSaleOption[]
  rentalOptions: CatalogRentalOption[]
}

async function loadCatalogBase(): Promise<CatalogBase> {
  const sb = getSupabase()
  const [barangRes, rentalRes, saleRes] = await Promise.all([
    sb
      .from("v_public_barang")
      .select("barang_id,usaha_nama,nama,slug,kategori_nama,deskripsi,ringkasan_publik")
      .eq("usaha_slug", USAHA_SLUG)
      .order("kategori_nama", { ascending: true })
      .order("nama", { ascending: true }),
    sb
      .from("v_public_katalog_rental")
      .select("*")
      .eq("usaha_slug", USAHA_SLUG),
    sb
      .from("v_public_katalog_jual")
      .select("*")
      .eq("usaha_slug", USAHA_SLUG)
      .order("barang_nama", { ascending: true }),
  ])

  if (barangRes.error) throw barangRes.error
  if (rentalRes.error) throw rentalRes.error
  if (saleRes.error) throw saleRes.error

  const products = (barangRes.data ?? []) as PublicBarang[]
  const rentalRows = (rentalRes.data ?? []) as PublicRentalRow[]
  const saleRows = (saleRes.data ?? []) as PublicSaleRow[]
  const productIds = [...new Set(products.map((row) => row.barang_id))]

  const mediaRes = productIds.length
    ? await sb
        .from("v_public_barang_media")
        .select("barang_id,storage_bucket,storage_path,media_type,urutan,is_cover")
        .in("barang_id", productIds)
        .order("is_cover", { ascending: false })
        .order("urutan", { ascending: true })
    : { data: [] as PublicMedia[], error: null }

  if (mediaRes.error) throw mediaRes.error

  const coverMediaByProduct = new Map<string, PublicMedia>()
  for (const media of (mediaRes.data ?? []) as PublicMedia[]) {
    if (media.barang_id && !coverMediaByProduct.has(media.barang_id)) {
      coverMediaByProduct.set(media.barang_id, media)
    }
  }

  const rentalTargets = new Map<string, PublicRentalRow[]>()
  for (const row of rentalRows) {
    const key = row.varian_barang_id
      ? "variant:" + row.varian_barang_id
      : "product:" + row.barang_id
    rentalTargets.set(key, [...(rentalTargets.get(key) ?? []), row])
  }

  const optionsByProduct = new Map<string, CatalogRentalOption[]>()
  for (const rows of rentalTargets.values()) {
    const best = pickBestTariff(rows.map((row) => ({
      ...row,
      nominal: row.harga_normal,
    })))
    if (!best) continue
    const option = buildRentalOption(best)
    optionsByProduct.set(best.barang_id, [...(optionsByProduct.get(best.barang_id) ?? []), option])
  }

  const items: CatalogItem[] = products.flatMap((product) => {
    const rentalOptions = optionsByProduct.get(product.barang_id) ?? []
    if (!rentalOptions.length) return []

    const variants: CatalogVariant[] = rentalOptions
      .filter((option) => option.varian_barang_id !== null)
      .map((option) => ({
        varian_barang_id: option.varian_barang_id as string,
        barang_id: product.barang_id,
        barang_nama: product.nama,
        nama: option.varian_nama ?? "Varian",
        kategori_nama: product.kategori_nama,
        deskripsi: rentalRows.find((row) => row.varian_barang_id === option.varian_barang_id)?.varian_deskripsi ?? null,
        price: option.price,
        normalPrice: option.normalPrice,
        discountPercent: option.discountPercent,
        priceDurationValue: option.priceDurationValue ?? 1,
        priceDurationUnit: option.priceDurationUnit ?? "hari",
        currency_code: option.currency_code,
        inventory_mode: option.inventory_mode,
      }))

    const directRentalOption = rentalOptions.find((option) => option.kind === "product") ?? null
    const bestItemPrice = Math.min(...rentalOptions.map((option) => option.price))
    const bestOption = rentalOptions.find((option) => option.price === bestItemPrice) ?? rentalOptions[0]

    return [{
      barang_id: product.barang_id,
      nama: product.nama,
      slug: product.slug,
      kategori_nama: product.kategori_nama,
      deskripsi: product.deskripsi,
      ringkasan_publik: product.ringkasan_publik,
      imageUrl: getPublicMediaUrl(coverMediaByProduct.get(product.barang_id)),
      variants,
      directRentalOption,
      minPrice: bestItemPrice,
      minPriceDurationValue: bestOption.priceDurationValue,
      minPriceDurationUnit: bestOption.priceDurationUnit,
    }]
  })

  const sales: CatalogSaleOption[] = saleRows.map((row) => ({
    key: row.varian_barang_id
      ? "sale-variant:" + row.varian_barang_id
      : "sale-product:" + row.barang_id,
    barang_id: row.barang_id,
    varian_barang_id: row.varian_barang_id,
    barang_nama: row.barang_nama,
    varian_nama: row.varian_nama,
    kategori_nama: row.kategori_nama,
    deskripsi: row.varian_deskripsi ?? row.barang_deskripsi,
    price: toNumber(row.harga_efektif),
    normalPrice: toNumber(row.harga_normal),
    discountPercent: toNumber(row.diskon_persen),
    currency_code: row.currency_code?.trim() || "IDR",
    inventory_mode: row.inventory_mode ?? "serialized",
    imageUrl: getPublicMediaUrl(coverMediaByProduct.get(row.barang_id)),
  }))

  return {
    usahaNama: products[0]?.usaha_nama ?? null,
    items,
    sales,
    rentalOptions: [...optionsByProduct.values()].flat(),
  }
}

async function loadPublicPackages(): Promise<CatalogPackage[]> {
  const sb = getSupabase()
  const { data, error } = await sb
    .from("v_public_paket_sewa")
    .select("*")
    .eq("usaha_slug", USAHA_SLUG)
    .order("nama", { ascending: true })

  if (error) throw error

  const publicPackages = (data ?? []) as PublicPackage[]
  const packageIds = publicPackages.map((item) => item.paket_sewa_id)
  if (packageIds.length === 0) return []

  const [mediaRes, tariffRes, promoRes] = await Promise.all([
    sb
      .from("paket_media")
      .select("paket_sewa_id,storage_bucket,storage_path,media_type,urutan,is_cover")
      .in("paket_sewa_id", packageIds)
      .eq("storage_bucket", PUBLIC_MEDIA_BUCKET)
      .eq("status", "valid")
      .like("media_type", "image/%")
      .order("is_cover", { ascending: false })
      .order("urutan", { ascending: true }),
    sb
      .from("v_public_tarif_sewa")
      .select("tarif_sewa_id,paket_sewa_id,nominal,durasi_unit,durasi_nilai,currency_code")
      .eq("usaha_slug", USAHA_SLUG)
      .in("paket_sewa_id", packageIds),
    sb
      .from("v_public_paket_promo")
      .select("paket_sewa_id,tarif_sewa_id,harga_normal,harga_promo,currency_code")
      .in("paket_sewa_id", packageIds),
  ])

  if (mediaRes.error) throw mediaRes.error
  if (tariffRes.error) throw tariffRes.error
  if (promoRes.error) throw promoRes.error

  const coverMediaByPackage = new Map<string, PublicMedia>()
  for (const media of (mediaRes.data ?? []) as PublicMedia[]) {
    if (media.paket_sewa_id && !coverMediaByPackage.has(media.paket_sewa_id)) {
      coverMediaByPackage.set(media.paket_sewa_id, media)
    }
  }

  const tariffs = (tariffRes.data ?? []) as PublicTariff[]
  const promos = (promoRes.data ?? []) as PublicPackagePromo[]
  return publicPackages.map((row) => {
    const packageTariffs = tariffs.filter((tariff) => tariff.paket_sewa_id === row.paket_sewa_id)
    const tariff = pickBestTariff(packageTariffs)
    const promo = tariff
      ? promos.find((entry) => entry.tarif_sewa_id === tariff.tarif_sewa_id)
      : undefined
    const normalPrice = tariff
      ? toNumber(tariff.nominal)
      : row.harga_dasar == null ? null : toNumber(row.harga_dasar)
    const price = promo
      ? toNumber(promo.harga_promo)
      : normalPrice

    return {
      paket_sewa_id: row.paket_sewa_id,
      nama: row.nama,
      slug: row.slug,
      deskripsi: row.deskripsi,
      imageUrl: getPublicMediaUrl(coverMediaByPackage.get(row.paket_sewa_id)),
      currency_code: tariff?.currency_code?.trim() ?? row.currency_code?.trim() ?? "IDR",
      price,
      normalPrice,
      discountPercent: promo && normalPrice && normalPrice > 0
        ? Math.round(((normalPrice - toNumber(promo.harga_promo)) / normalPrice) * 10000) / 100
        : 0,
      priceDurationValue: tariff?.durasi_nilai ?? null,
      priceDurationUnit: tariff?.durasi_unit ?? null,
      priceSource: tariff ? "tarif" : normalPrice !== null ? "harga_dasar" : null,
      canBook: Boolean(tariff),
    }
  })
}

const CACHE_OPTIONS = {
  revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
  tags: [PUBLIC_CATALOG_TAG, PUBLIC_CATALOG_TAG + ":" + USAHA_SLUG],
}

const getCachedCatalogBase = unstable_cache(
  loadCatalogBase,
  ["public-catalog-base-v5", USAHA_SLUG],
  CACHE_OPTIONS,
)

const getCachedPublicPackages = unstable_cache(
  loadPublicPackages,
  ["public-catalog-packages-v3", USAHA_SLUG],
  CACHE_OPTIONS,
)

export async function fetchHomeCatalog(): Promise<Catalog> {
  const [base, packages] = await Promise.all([
    getCachedCatalogBase(),
    getCachedPublicPackages(),
  ])
  return { usahaNama: base.usahaNama, items: base.items, packages, sales: base.sales }
}

export async function fetchCatalog(): Promise<Catalog> {
  const [base, packages] = await Promise.all([
    getCachedCatalogBase(),
    getCachedPublicPackages(),
  ])
  return { usahaNama: base.usahaNama, items: base.items, packages, sales: base.sales }
}

export function catalogCategories(items: CatalogItem[]): string[] {
  return [...new Set(items.map((item) => item.kategori_nama))].sort()
}
