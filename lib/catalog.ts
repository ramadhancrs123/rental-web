import { unstable_cache } from "next/cache"
import { getSupabase, USAHA_SLUG } from "@/lib/supabase"

export type CatalogVariant = {
  varian_barang_id: string
  barang_id: string
  barang_nama: string
  nama: string
  kategori_nama: string
  deskripsi: string | null
  price: number | null
  priceDurationValue: number | null
  priceDurationUnit: string | null
  currency_code: string
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
  minPrice: number | null
  minPriceDurationValue: number | null
  minPriceDurationUnit: string | null
}
export type CatalogPackage = {
  paket_sewa_id: string
  nama: string
  slug: string
  deskripsi: string | null
  imageUrl: string | null
  currency_code: string
  price: number | null
  priceDurationValue: number | null
  priceDurationUnit: string | null
  priceSource: "tarif" | "harga_dasar" | null
}
export type Catalog = { usahaNama: string | null; items: CatalogItem[]; packages: CatalogPackage[] }
type VPublicTarif = {
  tarif_sewa_id: string
  barang_id: string | null
  varian_barang_id: string | null
  paket_sewa_id: string | null
  nama: string
  durasi_unit: string
  durasi_nilai: number
  nominal: string | number
  currency_code: string
}
type VPublicPackage = {
  paket_sewa_id: string
  usaha_slug: string
  usaha_nama: string
  nama: string
  slug: string
  deskripsi: string | null
  harga_dasar: string | number | null
  currency_code: string
}
type VPublicMedia = {
  barang_id?: string
  paket_sewa_id?: string
  storage_bucket: string
  storage_path: string
  media_type: string
  urutan: number
  is_cover: boolean
  status: string
}
type VPublicPackageWithMedia = VPublicPackage & { imageUrl: string | null }

const PUBLIC_MEDIA_BUCKET = "rental-public-media"

function getPublicMediaUrl(media: VPublicMedia | undefined): string | null {
  if (!media || media.storage_bucket !== PUBLIC_MEDIA_BUCKET) return null
  return getSupabase().storage.from(PUBLIC_MEDIA_BUCKET).getPublicUrl(media.storage_path).data.publicUrl
}

function pickBestPrice(rows: VPublicTarif[]) {
  if (!rows.length) return null
  return [...rows].sort((a,b) => {
    const ad = a.durasi_unit.toLowerCase() === "hari" && a.durasi_nilai === 1
    const bd = b.durasi_unit.toLowerCase() === "hari" && b.durasi_nilai === 1
    if (ad !== bd) return ad ? -1 : 1
    if (a.durasi_unit !== b.durasi_unit) return a.durasi_unit.localeCompare(b.durasi_unit)
    if (a.durasi_nilai !== b.durasi_nilai) return a.durasi_nilai - b.durasi_nilai
    return Number(a.nominal) - Number(b.nominal)
  })[0]
}
export function formatRentalDuration(value: number | null, unit: string | null) {
  return value && unit ? String(value) + " " + unit : null
}
type CatalogBase = {
  usahaNama: string | null
  items: CatalogItem[]
  tariffs: VPublicTarif[]
}

async function loadCatalogBase(): Promise<CatalogBase> {
  const sb = getSupabase()
  const [barangRes, varianRes, tarifRes] = await Promise.all([
    sb.from("v_public_barang").select("*").eq("usaha_slug", USAHA_SLUG).order("kategori_nama", { ascending: true }).order("nama", { ascending: true }),
    sb.from("v_public_varian_barang").select("*").eq("usaha_slug", USAHA_SLUG).order("nama", { ascending: true }),
    sb.from("v_public_tarif_sewa").select("*").eq("usaha_slug", USAHA_SLUG),
  ])

  if (barangRes.error) throw barangRes.error
  if (varianRes.error) throw varianRes.error
  if (tarifRes.error) throw tarifRes.error

  const productIds = [...new Set((barangRes.data ?? []).map((row) => row.barang_id))]
  const mediaRes = productIds.length
    ? await sb
        .from("barang_media")
        .select("barang_id,storage_bucket,storage_path,media_type,urutan,is_cover,status")
        .in("barang_id", productIds)
        .eq("storage_bucket", PUBLIC_MEDIA_BUCKET)
        .eq("status", "valid")
        .like("media_type", "image/%")
        .order("is_cover", { ascending: false })
        .order("urutan", { ascending: true })
    : { data: [] as VPublicMedia[], error: null }

  if (mediaRes.error) throw mediaRes.error

  const coverMediaByProduct = new Map<string, VPublicMedia>()
  for (const media of (mediaRes.data ?? []) as VPublicMedia[]) {
    if (media.barang_id && !coverMediaByProduct.has(media.barang_id)) {
      coverMediaByProduct.set(media.barang_id, media)
    }
  }

  const tariffs = (tarifRes.data ?? []) as VPublicTarif[]
  const byVariant = new Map<string, VPublicTarif[]>()
  for (const row of tariffs) {
    if (row.varian_barang_id) {
      byVariant.set(row.varian_barang_id, [...(byVariant.get(row.varian_barang_id) ?? []), row])
    }
  }

  const productsById = new Map((barangRes.data ?? []).map((row) => [row.barang_id, row]))
  const grouped = new Map<string, CatalogItem>()
  const items: CatalogItem[] = []

  for (const variantRow of varianRes.data ?? []) {
    const product = productsById.get(variantRow.barang_id)
    if (!product) continue

    const tariff = pickBestPrice(byVariant.get(variantRow.varian_barang_id) ?? [])
    let item = grouped.get(product.barang_id)
    if (!item) {
      item = {
        barang_id: product.barang_id,
        nama: product.nama,
        slug: product.slug,
        kategori_nama: product.kategori_nama,
        deskripsi: product.deskripsi,
        ringkasan_publik: product.ringkasan_publik,
        imageUrl: getPublicMediaUrl(coverMediaByProduct.get(product.barang_id)),
        variants: [],
        minPrice: null,
        minPriceDurationValue: null,
        minPriceDurationUnit: null,
      }
      grouped.set(product.barang_id, item)
      items.push(item)
    }

    const variant: CatalogVariant = {
      varian_barang_id: variantRow.varian_barang_id,
      barang_id: variantRow.barang_id,
      barang_nama: product.nama,
      nama: variantRow.nama,
      kategori_nama: product.kategori_nama,
      deskripsi: variantRow.deskripsi,
      price: tariff ? Number(tariff.nominal) : null,
      priceDurationValue: tariff?.durasi_nilai ?? null,
      priceDurationUnit: tariff?.durasi_unit ?? null,
      currency_code: tariff?.currency_code ?? "IDR",
    }
    item.variants.push(variant)

    if (variant.price !== null && (item.minPrice === null || variant.price < item.minPrice)) {
      item.minPrice = variant.price
      item.minPriceDurationValue = variant.priceDurationValue
      item.minPriceDurationUnit = variant.priceDurationUnit
    }
  }

  const usahaNama = (barangRes.data?.[0] as { usaha_nama?: string } | undefined)?.usaha_nama ?? null
  return { usahaNama, items, tariffs }
}

async function loadPublicPackages(): Promise<VPublicPackageWithMedia[]> {
  const sb = getSupabase()
  const { data, error } = await sb
    .from("v_public_paket_sewa")
    .select("*")
    .eq("usaha_slug", USAHA_SLUG)
    .order("nama", { ascending: true })

  if (error) throw error

  const publicPackages = (data ?? []) as VPublicPackage[]
  const packageIds = publicPackages.map((item) => item.paket_sewa_id)
  if (packageIds.length === 0) return []

  const mediaRes = await sb
    .from("paket_media")
    .select("paket_sewa_id,storage_bucket,storage_path,media_type,urutan,is_cover,status")
    .in("paket_sewa_id", packageIds)
    .eq("storage_bucket", PUBLIC_MEDIA_BUCKET)
    .eq("status", "valid")
    .like("media_type", "image/%")
    .order("is_cover", { ascending: false })
    .order("urutan", { ascending: true })

  if (mediaRes.error) throw mediaRes.error

  const coverMediaByPackage = new Map<string, VPublicMedia>()
  for (const media of (mediaRes.data ?? []) as VPublicMedia[]) {
    if (media.paket_sewa_id && !coverMediaByPackage.has(media.paket_sewa_id)) {
      coverMediaByPackage.set(media.paket_sewa_id, media)
    }
  }

  return publicPackages.map((item) => ({
    ...item,
    imageUrl: getPublicMediaUrl(coverMediaByPackage.get(item.paket_sewa_id)),
  }))
}

const PUBLIC_CATALOG_REVALIDATE_SECONDS = 60
const PUBLIC_CATALOG_TAG = "public-catalog"
const PUBLIC_CATALOG_CACHE_OPTIONS = {
  revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
  tags: [PUBLIC_CATALOG_TAG, PUBLIC_CATALOG_TAG + ":" + USAHA_SLUG],
}

const getCachedCatalogBase = unstable_cache(
  loadCatalogBase,
  ["public-catalog-base-v3", USAHA_SLUG],
  PUBLIC_CATALOG_CACHE_OPTIONS,
)

const getCachedPublicPackages = unstable_cache(
  loadPublicPackages,
  ["public-catalog-packages-v2", USAHA_SLUG],
  PUBLIC_CATALOG_CACHE_OPTIONS,
)

function buildCatalogPackages(
  tariffs: VPublicTarif[],
  publicPackages: VPublicPackageWithMedia[],
): CatalogPackage[] {
  const byPackage = new Map<string, VPublicTarif[]>()

  for (const row of tariffs) {
    if (row.paket_sewa_id) {
      byPackage.set(row.paket_sewa_id, [...(byPackage.get(row.paket_sewa_id) ?? []), row])
    }
  }

  return publicPackages.map((row) => {
    const tariff = pickBestPrice(byPackage.get(row.paket_sewa_id) ?? [])
    const basePrice = row.harga_dasar == null ? null : Number(row.harga_dasar)
    return {
      paket_sewa_id: row.paket_sewa_id,
      nama: row.nama,
      slug: row.slug,
      deskripsi: row.deskripsi,
      imageUrl: row.imageUrl,
      currency_code: tariff?.currency_code ?? row.currency_code ?? "IDR",
      price: tariff ? Number(tariff.nominal) : basePrice,
      priceDurationValue: tariff?.durasi_nilai ?? null,
      priceDurationUnit: tariff?.durasi_unit ?? null,
      priceSource: tariff ? "tarif" : basePrice !== null ? "harga_dasar" : null,
    }
  })
}

export async function fetchHomeCatalog(): Promise<Catalog> {
  const [base, publicPackages] = await Promise.all([
    getCachedCatalogBase(),
    getCachedPublicPackages(),
  ])

  return {
    usahaNama: base.usahaNama ?? publicPackages[0]?.usaha_nama ?? null,
    items: base.items,
    packages: buildCatalogPackages(base.tariffs, publicPackages),
  }
}

export async function fetchCatalog(): Promise<Catalog> {
  const [base, publicPackages] = await Promise.all([
    getCachedCatalogBase(),
    getCachedPublicPackages(),
  ])

  return {
    usahaNama: base.usahaNama ?? publicPackages[0]?.usaha_nama ?? null,
    items: base.items,
    packages: buildCatalogPackages(base.tariffs, publicPackages),
  }
}

export function catalogCategories(items: CatalogItem[]): string[] {
  return [...new Set(items.map((item) => item.kategori_nama))].sort()
}
