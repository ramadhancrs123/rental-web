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
export async function fetchCatalog(): Promise<Catalog> {
  const sb = getSupabase()
  const [barangRes, varianRes, tarifRes, packagesRes] = await Promise.all([
    sb.from("v_public_barang").select("*").eq("usaha_slug", USAHA_SLUG).order("kategori_nama", {ascending:true}).order("nama", {ascending:true}),
    sb.from("v_public_varian_barang").select("*").eq("usaha_slug", USAHA_SLUG).order("nama", {ascending:true}),
    sb.from("v_public_tarif_sewa").select("*").eq("usaha_slug", USAHA_SLUG),
    sb.from("v_public_paket_sewa").select("*").eq("usaha_slug", USAHA_SLUG).order("nama", {ascending:true}),
  ])
  if (barangRes.error) throw barangRes.error
  if (varianRes.error) throw varianRes.error
  if (tarifRes.error) throw tarifRes.error
  if (packagesRes.error) throw packagesRes.error

  const tariffs = (tarifRes.data ?? []) as VPublicTarif[]
  const byVariant = new Map<string,VPublicTarif[]>()
  const byPackage = new Map<string,VPublicTarif[]>()
  for (const row of tariffs) {
    if (row.varian_barang_id) byVariant.set(row.varian_barang_id,[...(byVariant.get(row.varian_barang_id) ?? []),row])
    if (row.paket_sewa_id) byPackage.set(row.paket_sewa_id,[...(byPackage.get(row.paket_sewa_id) ?? []),row])
  }
  const productsById = new Map(barangRes.data.map((row) => [row.barang_id,row]))
  const grouped = new Map<string,CatalogItem>()
  const items: CatalogItem[] = []
  for (const variantRow of varianRes.data) {
    const product = productsById.get(variantRow.barang_id)
    if (!product) continue
    const tariff = pickBestPrice(byVariant.get(variantRow.varian_barang_id) ?? [])
    let item = grouped.get(product.barang_id)
    if (!item) {
      item = {barang_id:product.barang_id,nama:product.nama,slug:product.slug,kategori_nama:product.kategori_nama,deskripsi:product.deskripsi,ringkasan_publik:product.ringkasan_publik,variants:[],minPrice:null,minPriceDurationValue:null,minPriceDurationUnit:null}
      grouped.set(product.barang_id,item)
      items.push(item)
    }
    const variant: CatalogVariant = {
      varian_barang_id:variantRow.varian_barang_id,barang_id:variantRow.barang_id,barang_nama:product.nama,nama:variantRow.nama,kategori_nama:product.kategori_nama,deskripsi:variantRow.deskripsi,
      price:tariff ? Number(tariff.nominal) : null,priceDurationValue:tariff?.durasi_nilai ?? null,priceDurationUnit:tariff?.durasi_unit ?? null,currency_code:tariff?.currency_code ?? "IDR",
    }
    item.variants.push(variant)
    if (variant.price !== null && (item.minPrice === null || variant.price < item.minPrice)) {
      item.minPrice = variant.price
      item.minPriceDurationValue = variant.priceDurationValue
      item.minPriceDurationUnit = variant.priceDurationUnit
    }
  }
  const publicPackages = (packagesRes.data ?? []) as VPublicPackage[]
  const packages: CatalogPackage[] = publicPackages.map((row) => {
    const tariff = pickBestPrice(byPackage.get(row.paket_sewa_id) ?? [])
    const basePrice = row.harga_dasar == null ? null : Number(row.harga_dasar)
    return {
      paket_sewa_id:row.paket_sewa_id,nama:row.nama,slug:row.slug,deskripsi:row.deskripsi,currency_code:tariff?.currency_code ?? row.currency_code ?? "IDR",
      price:tariff ? Number(tariff.nominal) : basePrice,priceDurationValue:tariff?.durasi_nilai ?? null,priceDurationUnit:tariff?.durasi_unit ?? null,
      priceSource:tariff ? "tarif" : basePrice !== null ? "harga_dasar" : null,
    }
  })
  const usahaNama = (barangRes.data[0] as {usaha_nama?:string}|undefined)?.usaha_nama ?? publicPackages[0]?.usaha_nama ?? null
  return {usahaNama,items,packages}
}
export function catalogCategories(items: CatalogItem[]): string[] {
  return [...new Set(items.map((item) => item.kategori_nama))].sort()
}
